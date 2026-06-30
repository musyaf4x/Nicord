import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateExpenseSchema = z.object({
  category: z.enum([
    "BAHAN_BAKU", "PACKAGING", "ONGKIR", "IKLAN",
    "OPERASIONAL", "GAJI", "LAIN_LAIN",
  ]).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
});

async function getExpense(id: string, userId: string) {
  return prisma.expense.findFirst({
    where: {
      id,
      business: { members: { some: { userId } } },
    },
  });
}

// ─── GET /api/expenses/[id] ───────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const expense = await getExpense(id, session.user.id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(expense);
}

// ─── PATCH /api/expenses/[id] ─────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const expense = await getExpense(id, session.user.id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
    },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/expenses/[id] ────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const expense = await getExpense(id, session.user.id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
