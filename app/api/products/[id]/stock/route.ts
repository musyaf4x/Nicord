import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── GET /api/products/[id]/stock-movements ───────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session.user.id } } },
    },
    select: { id: true, name: true, stock: true, unit: true, isUnlimited: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ product, movements });
}

// ─── POST /api/products/[id]/stock-adjust ────────────────────────────────────

const stockAdjustSchema = z.object({
  type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session.user.id } } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (product.isUnlimited) {
    return NextResponse.json(
      { error: "Produk ini menggunakan mode stok unlimited" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = stockAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, quantity, notes } = parsed.data;

  const stockBefore = product.stock;
  const stockAfter =
    type === "ADJUSTMENT_IN" ? stockBefore + quantity : stockBefore - quantity;

  if (stockAfter < 0) {
    return NextResponse.json(
      { error: `Stok tidak cukup. Stok saat ini: ${stockBefore}` },
      { status: 400 }
    );
  }

  const movement = await prisma.$transaction(async (tx) => {
    const created = await tx.stockMovement.create({
      data: {
        productId: id,
        type,
        quantity,
        stockBefore,
        stockAfter,
        notes,
        createdBy: session.user!.id!,
      },
    });
    await tx.product.update({
      where: { id },
      data: { stock: stockAfter },
    });
    return created;
  });

  return NextResponse.json(movement, { status: 201 });
}
