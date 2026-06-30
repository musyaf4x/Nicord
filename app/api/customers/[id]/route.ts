import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  whatsappNumber: z
    .string()
    .regex(/^62\d{8,13}$/, "Format: 628xxxxxxxxx")
    .optional()
    .nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function getCustomer(customerId: string, userId: string) {
  return prisma.customer.findFirst({
    where: {
      id: customerId,
      business: { members: { some: { userId } } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session.user.id } } },
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          grandTotal: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getCustomer(id, session.user.id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check for WA duplicate (exclude self)
  if (parsed.data.whatsappNumber && parsed.data.whatsappNumber !== existing.whatsappNumber) {
    const duplicate = await prisma.customer.findUnique({
      where: {
        businessId_whatsappNumber: {
          businessId: existing.businessId,
          whatsappNumber: parsed.data.whatsappNumber,
        },
      },
    });
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah terdaftar pada pelanggan lain", existingId: duplicate.id },
        { status: 409 }
      );
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(customer);
}
