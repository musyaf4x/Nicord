import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── Valid transitions ────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "PROCESSING", "READY", "DELIVERED", "CANCELLED"]),
  notes: z.string().optional(),
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
    include: {
      items: {
        include: { product: true },
      },
      business: { select: { stockDeductOn: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status: nextStatus, notes } = parsed.data;
  const validNext = VALID_TRANSITIONS[order.status] ?? [];

  if (!validNext.includes(nextStatus)) {
    return NextResponse.json(
      {
        error: `Tidak bisa mengubah status dari ${order.status} ke ${nextStatus}`,
        validTransitions: validNext,
      },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update order status
    const updated = await tx.order.update({
      where: { id },
      data: { status: nextStatus },
    });

    // Record status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: nextStatus,
        notes,
        changedBy: session.user!.id!,
      },
    });

    // Deduct stock when CONFIRMED (if business setting = CONFIRMED)
    if (nextStatus === "CONFIRMED" && order.business.stockDeductOn === "CONFIRMED") {
      for (const item of order.items) {
        if (!item.product.isUnlimited) {
          const product = await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "ORDER_OUT",
              quantity: item.quantity,
              stockBefore: product.stock + item.quantity,
              stockAfter: product.stock,
              referenceId: id,
              notes: `Order ${order.orderNumber}`,
              createdBy: session.user!.id!,
            },
          });
        }
      }
    }

    // Return stock when CANCELLED (only if stock was previously deducted)
    if (nextStatus === "CANCELLED") {
      const wasDeducted =
        (order.business.stockDeductOn === "CONFIRMED" &&
          ["CONFIRMED", "PROCESSING", "READY", "DELIVERED"].includes(order.status)) ||
        (order.business.stockDeductOn === "PAID" &&
          order.paymentStatus !== "UNPAID");

      if (wasDeducted) {
        for (const item of order.items) {
          if (!item.product.isUnlimited) {
            const product = await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: "RETURN_IN",
                quantity: item.quantity,
                stockBefore: product.stock - item.quantity,
                stockAfter: product.stock,
                referenceId: id,
                notes: `Pembatalan ${order.orderNumber}`,
                createdBy: session.user!.id!,
              },
            });
          }
        }
      }
    }

    return updated;
  });

  return NextResponse.json(result);
}
