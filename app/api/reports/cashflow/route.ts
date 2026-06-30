import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eachDayOfInterval, format, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.businessMember.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });
  if (!member) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const exportCsv = searchParams.get("format") === "csv";

  const { businessId } = member;

  const [payments, expenses] = await Promise.all([
    // Inflow: all payments in period
    prisma.payment.findMany({
      where: {
        order: { businessId },
        paidAt: { gte: from, lte: to },
      },
      select: { amount: true, paidAt: true, method: true },
      orderBy: { paidAt: "asc" },
    }),
    // Outflow: all expenses in period
    prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: from, lte: to },
      },
      select: { amount: true, date: true, category: true, notes: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalInflow = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalOutflow = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netBalance = totalInflow - totalOutflow;

  // Build daily timeline
  const days = eachDayOfInterval({ start: from, end: to });
  const dailyMap: Record<string, { inflow: number; outflow: number }> = {};
  for (const day of days) {
    dailyMap[format(day, "yyyy-MM-dd")] = { inflow: 0, outflow: 0 };
  }
  for (const p of payments) {
    const key = format(startOfDay(new Date(p.paidAt)), "yyyy-MM-dd");
    if (dailyMap[key]) dailyMap[key].inflow += Number(p.amount);
  }
  for (const e of expenses) {
    const key = format(startOfDay(new Date(e.date)), "yyyy-MM-dd");
    if (dailyMap[key]) dailyMap[key].outflow += Number(e.amount);
  }
  const timeline = Object.entries(dailyMap).map(([date, v]) => ({
    date,
    inflow: v.inflow,
    outflow: v.outflow,
    net: v.inflow - v.outflow,
  }));

  if (exportCsv) {
    const rows = [
      ["Tanggal", "Tipe", "Jumlah", "Keterangan"].join(","),
      ...payments.map((p) =>
        [
          new Date(p.paidAt).toISOString().slice(0, 10),
          "INFLOW",
          Number(p.amount).toFixed(0),
          p.method,
        ].join(",")
      ),
      ...expenses.map((e) =>
        [
          new Date(e.date).toISOString().slice(0, 10),
          "OUTFLOW",
          (-Number(e.amount)).toFixed(0),
          `"${e.category}${e.notes ? " - " + e.notes : ""}"`,
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cashflow-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    summary: { totalInflow, totalOutflow, netBalance },
    timeline,
  });
}
