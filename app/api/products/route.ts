import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  sellingPrice: z.number().positive("Harga harus lebih dari 0"),
  costPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, "Stok tidak boleh negatif").default(0),
  unit: z.string().default("pcs"),
  imageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isUnlimited: z.boolean().default(false),
});

async function getBusinessId(userId: string): Promise<string | null> {
  const member = await prisma.businessMember.findFirst({
    where: { userId },
    select: { businessId: true },
  });
  return member?.businessId ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const active = searchParams.get("active");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

  const where = {
    businessId,
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
    ...(active !== null && { isActive: active === "true" }),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, businessId },
  });

  return NextResponse.json(product, { status: 201 });
}
