import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentSchema = z.object({
  method: z.enum(["CASH", "TRANSFER", "QRIS", "GOPAY", "OVO", "DANA", "SHOPEEPAY", "OTHER"]),
  amount: z.number().positive("Nominal harus lebih dari 0"),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const payments = await prisma.payment.findMany({
    where: {
      orderId: id,
      order: {
        business: { members: { some: { userId: session.user.id } } },
      },
    },
    orderBy: { paidAt: "asc" },
  });

  return NextResponse.json(payments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session.user.id } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Tidak bisa mencatat pembayaran untuk order yang dibatalkan" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { method, amount, notes, paidAt } = parsed.data;

  const currentAmountPaid = Number(order.amountPaid);
  const grandTotal = Number(order.grandTotal);
  const newAmountPaid = currentAmountPaid + amount;
  const newAmountDue = Math.max(0, grandTotal - newAmountPaid);

  // Determine new payment status
  const newPaymentStatus =
    newAmountPaid >= grandTotal
      ? "PAID"
      : newAmountPaid > 0
      ? "PARTIAL"
      : "UNPAID";

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId: id,
        method,
        amount,
        notes,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        createdBy: session.user!.id!,
      },
    }),
    prisma.order.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        paymentStatus: newPaymentStatus,
      },
    }),
  ]);

  return NextResponse.json(payment, { status: 201 });
}
