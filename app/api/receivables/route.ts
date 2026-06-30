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

  if (!member) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  // age filter in days: 7, 14, 30+
  const ageStr = searchParams.get("age");

  const dateFilter = ageStr
    ? new Date(Date.now() - parseInt(ageStr, 10) * 24 * 60 * 60 * 1000)
    : undefined;

  const orders = await prisma.order.findMany({
    where: {
      businessId: member.businessId,
      paymentStatus: { in: ["UNPAID", "PARTIAL"] },
      status: { not: "CANCELLED" },
      ...(dateFilter && { orderDate: { lte: dateFilter } }),
    },
    orderBy: { orderDate: "asc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      amountPaid: true,
      amountDue: true,
      orderDate: true,
      customer: { select: { id: true, name: true, whatsappNumber: true } },
    },
  });

  const totalReceivable = orders.reduce((s, o) => s + Number(o.amountDue), 0);

  return NextResponse.json({
    data: orders,
    meta: { total: orders.length, totalReceivable },
  });
}
