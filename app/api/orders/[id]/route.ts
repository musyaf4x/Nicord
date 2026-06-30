import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── Status machine ───────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
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
    include: {
      customer: { select: { id: true, name: true, whatsappNumber: true, address: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true, unit: true } },
        },
      },
      payments: { orderBy: { paidAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
      invoice: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

// ─── PATCH /api/orders/[id] ───────────────────────────────────────────────────

const updateOrderSchema = z.object({
  notes: z.string().optional(),
  deliveryDate: z.string().optional().nullable(),
  shippingCost: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
});

export async function PATCH(
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
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!["DRAFT", "CONFIRMED"].includes(order.status)) {
    return NextResponse.json(
      { error: "Order tidak bisa diubah setelah diproses" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Recalculate grand total if discount/shippingCost changed
  const discount = parsed.data.discount ?? Number(order.discount);
  const shippingCost = parsed.data.shippingCost ?? Number(order.shippingCost);
  const subtotal = Number(order.subtotal);
  const grandTotal = subtotal - discount + shippingCost;
  const amountDue = grandTotal - Number(order.amountPaid);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...parsed.data,
      deliveryDate: parsed.data.deliveryDate ? new Date(parsed.data.deliveryDate) : order.deliveryDate,
      discount,
      shippingCost,
      grandTotal,
      amountDue,
    },
  });

  return NextResponse.json(updated);
}
