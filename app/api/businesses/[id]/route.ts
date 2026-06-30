import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  whatsappNumber: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  paymentMethods: z.array(z.string()).optional(),
  defaultNotes: z.string().optional().nullable(),
  isOnboarded: z.boolean().optional(),
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

  const business = await prisma.business.findFirst({
    where: {
      id,
      members: { some: { userId: session.user.id } },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(business);
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

  // Verify ownership
  const member = await prisma.businessMember.findFirst({
    where: {
      businessId: id,
      userId: session.user.id,
      role: "OWNER",
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateBusinessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const business = await prisma.business.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(business);
}
