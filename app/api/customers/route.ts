import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Nama pelanggan wajib diisi"),
  whatsappNumber: z
    .string()
    .regex(/^62\d{8,13}$/, "Format: 628xxxxxxxxx")
    .optional()
    .nullable(),
  address: z.string().optional(),
  notes: z.string().optional(),
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
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

  const where = {
    businessId,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { whatsappNumber: { contains: q } },
      ],
    }),
  };

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { orders: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    data: customers,
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
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Warn if WA number already exists for another customer
  if (parsed.data.whatsappNumber) {
    const exists = await prisma.customer.findUnique({
      where: {
        businessId_whatsappNumber: {
          businessId,
          whatsappNumber: parsed.data.whatsappNumber,
        },
      },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah terdaftar pada pelanggan lain", existingId: exists.id },
        { status: 409 }
      );
    }
  }

  const customer = await prisma.customer.create({
    data: { ...parsed.data, businessId },
  });

  return NextResponse.json(customer, { status: 201 });
}
