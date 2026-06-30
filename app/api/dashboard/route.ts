import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
} from "date-fns";

type Period = "today" | "week" | "month";

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.businessMember.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });

  if (!member) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "month") as Period;
  const { from, to } = getPeriodRange(period);
  const { businessId } = member;

  // Run all queries in parallel
  const [
    orders,
    orderStatusCounts,
    paidPayments,
    piutang,
    expenses,
    topProducts,
    lowStockProducts,
  ] = await Promise.all([
    // All orders in period
    prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: {
        grandTotal: true,
        paymentStatus: true,
        status: true,
      },
    }),

    // Order count by status
    prisma.order.groupBy({
      by: ["status"],
      where: {
        businessId,
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      _count: true,
    }),

    // Paid payments in period (actual cash collected)
    prisma.payment.findMany({
      where: {
        order: { businessId },
        paidAt: { gte: from, lte: to },
      },
      select: { amount: true },
    }),

    // Total outstanding receivables (all time)
    prisma.order.aggregate({
      where: {
        businessId,
        paymentStatus: { in: ["UNPAID", "PARTIAL"] },
        status: { not: "CANCELLED" },
      },
      _sum: { amountDue: true },
    }),

    // Expenses in period
    prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: from, lte: to },
      },
      select: { amount: true, category: true },
    }),

    // Top 5 selling products in period (by quantity)
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        order: {
          businessId,
          createdAt: { gte: from, lte: to },
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),

    // Low stock products (≤ threshold, not unlimited)
    prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
        isUnlimited: false,
        stock: { lte: parseInt(process.env.LOW_STOCK_THRESHOLD ?? "5", 10) },
      },
      select: { id: true, name: true, stock: true, unit: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  // Compute metrics
  const omzet = orders.reduce((s, o) => s + Number(o.grandTotal), 0);
  const totalOrders = orders.length;
  const cashCollected = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalReceivable = Number(piutang._sum.amountDue ?? 0);

  // HPP estimate: sum of costPrice × qty from order items in period
  const orderItemsWithCost = await prisma.orderItem.findMany({
    where: {
      order: {
        businessId,
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
    },
    include: {
      product: { select: { costPrice: true } },
    },
  });
  const hpp = orderItemsWithCost.reduce(
    (s, item) => s + Number(item.product.costPrice ?? 0) * item.quantity,
    0
  );
  const estimasiLaba = cashCollected - totalExpenses - hpp;

  // Status breakdown map
  const statusBreakdown = orderStatusCounts.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.status] = r._count;
      return acc;
    },
    {}
  );

  // Expense by category
  const expenseByCategory = expenses.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    },
    {}
  );

  return NextResponse.json({
    period,
    periodRange: { from: from.toISOString(), to: to.toISOString() },
    metrics: {
      omzet,
      cashCollected,
      totalOrders,
      totalReceivable,
      totalExpenses,
      hpp,
      estimasiLaba,
    },
    statusBreakdown,
    expenseByCategory,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      totalQty: p._sum.quantity ?? 0,
      totalRevenue: Number(p._sum.subtotal ?? 0),
    })),
    lowStockProducts,
  });
}
