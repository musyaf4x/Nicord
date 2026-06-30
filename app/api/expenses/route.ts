import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const expenseSchema = z.object({
  category: z.enum([
    "BAHAN_BAKU", "PACKAGING", "ONGKIR", "IKLAN",
    "OPERASIONAL", "GAJI", "LAIN_LAIN",
  ]),
  amount: z.number().positive("Nominal harus lebih dari 0"),
  date: z.string(),
  notes: z.string().optional(),
});

// ─── GET /api/expenses ────────────────────────────────────────────────────────

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
  const category = searchParams.get("category");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

  const where = {
    businessId: member.businessId,
    ...(category && { category: category as any }),
    ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
    ...(dateTo && { date: { lte: new Date(dateTo) } }),
  };

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  // Total per category for the filter period
  const categoryTotals = await prisma.expense.groupBy({
    by: ["category"],
    where,
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  return NextResponse.json({
    data: expenses,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
    categoryTotals,
  });
}

// ─── POST /api/expenses ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { category, amount, date, notes } = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      businessId: member.businessId,
      category,
      amount,
      date: new Date(date),
      notes,
      createdBy: session.user!.id!,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
