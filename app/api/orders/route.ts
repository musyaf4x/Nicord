import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { format } from "date-fns";

// ─── Schema ──────────────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1, "Pelanggan wajib dipilih"),
  items: z.array(orderItemSchema).min(1, "Minimal 1 produk"),
  channel: z
    .enum(["WHATSAPP", "INSTAGRAM", "TIKTOK", "MARKETPLACE", "OFFLINE", "OTHER"])
    .default("WHATSAPP"),
  deliveryDate: z.string().optional().nullable(),
  discount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// ─── Order number generator ───────────────────────────────────────────────────

async function generateOrderNumber(businessId: string): Promise<string> {
  const datePart = format(new Date(), "yyyyMMdd");
  const prefix = `ORD-${datePart}-`;

  const last = await prisma.order.findFirst({
    where: { businessId, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const seq = last
    ? parseInt(last.orderNumber.split("-").pop() ?? "0", 10) + 1
    : 1;

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

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
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const customerId = searchParams.get("customerId");
  const q = searchParams.get("q") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

  const where = {
    businessId: member.businessId,
    ...(status && { status: status as any }),
    ...(paymentStatus && { paymentStatus: paymentStatus as any }),
    ...(customerId && { customerId }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" as const } },
        { customer: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
    ...(dateFrom && { orderDate: { gte: new Date(dateFrom) } }),
    ...(dateTo && { orderDate: { lte: new Date(dateTo) } }),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        amountDue: true,
        orderDate: true,
        createdAt: true,
        customer: { select: { id: true, name: true, whatsappNumber: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    data: orders,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.businessMember.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true, business: { select: { stockDeductOn: true } } },
  });

  if (!member) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerId, items, channel, deliveryDate, discount, shippingCost, notes } = parsed.data;

  // Fetch products for price lookup
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, businessId: member.businessId, isActive: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "Satu atau lebih produk tidak ditemukan atau sudah nonaktif" },
      { status: 400 }
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build order items and calculate totals
  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.sellingPrice);
    const subtotal = unitPrice * item.quantity;
    return {
      productId: item.productId,
      productName: product.name,
      unitPrice,
      quantity: item.quantity,
      subtotal,
    };
  });

  const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const grandTotal = subtotal - discount + shippingCost;
  const amountDue = grandTotal;

  const orderNumber = await generateOrderNumber(member.businessId);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        businessId: member.businessId,
        customerId,
        orderNumber,
        channel,
        status: "DRAFT",
        paymentStatus: "UNPAID",
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        discount,
        shippingCost,
        subtotal,
        grandTotal,
        amountPaid: 0,
        amountDue,
        notes,
        items: {
          create: orderItems,
        },
        statusHistory: {
          create: {
            status: "DRAFT",
            changedBy: session.user!.id!,
          },
        },
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true } },
      },
    });

    return created;
  });

  return NextResponse.json(order, { status: 201 });
}
