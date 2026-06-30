import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.businessMember.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });
  if (!member) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : new Date();
  const format = searchParams.get("format"); // "csv"

  const { businessId } = member;

  const [orders, paymentsByMethod, productSales] = await Promise.all([
    prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        amountPaid: true,
        orderDate: true,
        channel: true,
        customer: { select: { name: true } },
      },
      orderBy: { orderDate: "asc" },
    }),

    // Breakdown by payment method
    prisma.payment.groupBy({
      by: ["method"],
      where: {
        order: { businessId },
        paidAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Product sales breakdown
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
    }),
  ]);

  const totalOmzet = orders.reduce((s, o) => s + Number(o.grandTotal), 0);
  const totalCashCollected = orders.reduce((s, o) => s + Number(o.amountPaid), 0);
  const totalItemsSold = productSales.reduce((s, p) => s + (p._sum.quantity ?? 0), 0);

  if (format === "csv") {
    const rows = [
      ["No Order", "Pelanggan", "Tanggal", "Channel", "Status", "Status Bayar", "Total", "Dibayar"].join(","),
      ...orders.map((o) =>
        [
          o.orderNumber,
          `"${o.customer.name}"`,
          o.orderDate.toISOString().slice(0, 10),
          o.channel,
          o.status,
          o.paymentStatus,
          Number(o.grandTotal).toFixed(0),
          Number(o.amountPaid).toFixed(0),
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-penjualan-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      totalOmzet,
      totalCashCollected,
      totalOrders: orders.length,
      totalItemsSold,
    },
    orders,
    paymentsByMethod: paymentsByMethod.map((p) => ({
      method: p.method,
      total: Number(p._sum.amount ?? 0),
      count: p._count,
    })),
    productSales: productSales.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      totalQty: p._sum.quantity ?? 0,
      totalRevenue: Number(p._sum.subtotal ?? 0),
    })),
  });
}
