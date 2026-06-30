"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  VStack, HStack, Heading, Text, Button, Card,
} from "@astryxdesign/core";
import { Download, BarChart2 } from "lucide-react";
import { formatRupiah } from "@/lib/types/order";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const REPORT_TABS = [
  { value: "sales", label: "Penjualan" },
  { value: "cashflow", label: "Cashflow" },
] as const;
type ReportTab = typeof REPORT_TABS[number]["value"];

// ─── Sales Report ─────────────────────────────────────────────────────────────

interface SalesData {
  period: { from: string; to: string };
  summary: { totalOmzet: number; totalCashCollected: number; totalOrders: number; totalItemsSold: number };
  productSales: { productId: string; productName: string; totalQty: number; totalRevenue: number }[];
  paymentsByMethod: { method: string; total: number; count: number }[];
}

function SalesReport({ from, to }: { from: string; to: string }) {
  const params = new URLSearchParams({ from, to });
  const { data, isLoading } = useQuery<SalesData>({
    queryKey: ["report-sales", from, to],
    queryFn: () => fetch(`/api/reports/sales?${params}`).then((r) => r.json()),
    enabled: !!from && !!to,
  });

  if (isLoading) return <VStack gap={3}>{[1,2,3].map((i) => <div key={i} style={{ height: 70, borderRadius: 12, background: "var(--color-wash)", animation: "pulse 1.5s infinite" }} />)}</VStack>;
  if (!data) return null;

  const { summary, productSales, paymentsByMethod } = data;

  return (
    <VStack gap={4}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--spacing-3)" }}>
        {[
          { label: "Total Omzet", value: formatRupiah(summary.totalOmzet) },
          { label: "Kas Diterima", value: formatRupiah(summary.totalCashCollected) },
          { label: "Jumlah Order", value: `${summary.totalOrders} order` },
          { label: "Item Terjual", value: `${summary.totalItemsSold} item` },
        ].map((m) => (
          <Card key={m.label} style={{ padding: "var(--spacing-3)" }}>
            <VStack gap={0}>
              <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>{m.label}</Text>
              <Text size="sm" style={{ fontWeight: 800 }}>{m.value}</Text>
            </VStack>
          </Card>
        ))}
      </div>

      {/* Product sales */}
      {productSales.length > 0 && (
        <VStack gap={2}>
          <Text size="sm" style={{ fontWeight: 700 }}>Produk Terjual</Text>
          <VStack gap={1}>
            {productSales.slice(0, 10).map((p) => (
              <HStack key={p.productId} justify="between" align="center" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-default)" }}>
                <Text size="sm">{p.productName}</Text>
                <HStack gap={4}>
                  <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>{p.totalQty}×</Text>
                  <Text size="sm" style={{ fontWeight: 700 }}>{formatRupiah(p.totalRevenue)}</Text>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </VStack>
      )}

      {/* Payment methods */}
      {paymentsByMethod.length > 0 && (
        <VStack gap={2}>
          <Text size="sm" style={{ fontWeight: 700 }}>Metode Pembayaran</Text>
          <VStack gap={1}>
            {paymentsByMethod.map((p) => (
              <HStack key={p.method} justify="between" align="center" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-default)" }}>
                <Text size="sm">{p.method}</Text>
                <HStack gap={4}>
                  <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>{p.count}×</Text>
                  <Text size="sm" style={{ fontWeight: 700 }}>{formatRupiah(p.total)}</Text>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </VStack>
      )}
    </VStack>
  );
}

// ─── Cashflow Report ──────────────────────────────────────────────────────────

interface CashflowData {
  period: { from: string; to: string };
  summary: { totalInflow: number; totalOutflow: number; netBalance: number };
  timeline: { date: string; inflow: number; outflow: number; net: number }[];
}

function CashflowReport({ from, to }: { from: string; to: string }) {
  const params = new URLSearchParams({ from, to });
  const { data, isLoading } = useQuery<CashflowData>({
    queryKey: ["report-cashflow", from, to],
    queryFn: () => fetch(`/api/reports/cashflow?${params}`).then((r) => r.json()),
    enabled: !!from && !!to,
  });

  if (isLoading) return <VStack gap={3}>{[1,2,3].map((i) => <div key={i} style={{ height: 70, borderRadius: 12, background: "var(--color-wash)", animation: "pulse 1.5s infinite" }} />)}</VStack>;
  if (!data) return null;

  const { summary, timeline } = data;
  const activeDays = timeline.filter((d) => d.inflow > 0 || d.outflow > 0);

  return (
    <VStack gap={4}>
      {/* Net balance summary */}
      <Card
        style={{
          padding: "var(--spacing-5)",
          background: summary.netBalance >= 0 ? "var(--color-success-wash)" : "var(--color-critical-wash)",
          border: `1.5px solid ${summary.netBalance >= 0 ? "var(--color-success-border)" : "var(--color-critical-border)"}`,
        }}
      >
        <VStack gap={1}>
          <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>Saldo Bersih</Text>
          <Text
            size="lg"
            style={{
              fontWeight: 800,
              color: summary.netBalance >= 0 ? "var(--color-success-text)" : "var(--color-critical-text)",
            }}
          >
            {summary.netBalance >= 0 ? "+" : ""}{formatRupiah(summary.netBalance)}
          </Text>
        </VStack>
      </Card>

      {/* Inflow / Outflow */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-3)" }}>
        <Card style={{ padding: "var(--spacing-3)", border: "1.5px solid var(--color-success-border)" }}>
          <VStack gap={0}>
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>Total Inflow</Text>
            <Text size="sm" style={{ fontWeight: 800, color: "var(--color-success-text)" }}>
              +{formatRupiah(summary.totalInflow)}
            </Text>
          </VStack>
        </Card>
        <Card style={{ padding: "var(--spacing-3)", border: "1.5px solid var(--color-critical-border)" }}>
          <VStack gap={0}>
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>Total Outflow</Text>
            <Text size="sm" style={{ fontWeight: 800, color: "var(--color-critical-text)" }}>
              -{formatRupiah(summary.totalOutflow)}
            </Text>
          </VStack>
        </Card>
      </div>

      {/* Timeline */}
      {activeDays.length > 0 && (
        <VStack gap={2}>
          <Text size="sm" style={{ fontWeight: 700 }}>Rincian Harian</Text>
          <VStack gap={1}>
            {activeDays.map((d) => (
              <HStack key={d.date} justify="between" align="center" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-default)" }}>
                <Text size="sm">
                  {format(new Date(d.date), "d MMM", { locale: localeId })}
                </Text>
                <HStack gap={4}>
                  {d.inflow > 0 && (
                    <Text size="sm" style={{ color: "var(--color-success-text)", fontWeight: 600 }}>
                      +{formatRupiah(d.inflow)}
                    </Text>
                  )}
                  {d.outflow > 0 && (
                    <Text size="sm" style={{ color: "var(--color-critical-text)", fontWeight: 600 }}>
                      -{formatRupiah(d.outflow)}
                    </Text>
                  )}
                </HStack>
              </HStack>
            ))}
          </VStack>
        </VStack>
      )}
    </VStack>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────

export function ReportsClient() {
  const [tab, setTab] = useState<ReportTab>("sales");
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = now.toISOString().slice(0, 10);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const exportUrl = `/api/reports/${tab}?from=${from}&to=${to}&format=csv`;

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <Heading level={1}>Laporan</Heading>
        <a
          href={exportUrl}
          download
          id="export-csv-btn"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: "var(--color-accent)", color: "#fff",
            textDecoration: "none", fontSize: 13, fontWeight: 600,
          }}
        >
          <Download size={14} />
          Export CSV
        </a>
      </HStack>

      {/* Date range */}
      <Card style={{ padding: "var(--spacing-4)" }}>
        <HStack gap={3} align="center">
          <VStack gap={1} style={{ flex: 1 }}>
            <Text size="xsm" style={{ fontWeight: 600 }}>Dari</Text>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--color-border-default)", background: "transparent", color: "var(--color-text-primary)", fontSize: 13, outline: "none" }}
            />
          </VStack>
          <Text size="sm" style={{ color: "var(--color-text-secondary)", marginTop: 20 }}>—</Text>
          <VStack gap={1} style={{ flex: 1 }}>
            <Text size="xsm" style={{ fontWeight: 600 }}>Sampai</Text>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--color-border-default)", background: "transparent", color: "var(--color-text-primary)", fontSize: 13, outline: "none" }}
            />
          </VStack>
        </HStack>
      </Card>

      {/* Tab switcher */}
      <HStack gap={0} style={{ borderBottom: "2px solid var(--color-border-default)" }}>
        {REPORT_TABS.map((t) => (
          <button
            key={t.value}
            id={`report-tab-${t.value}`}
            onClick={() => setTab(t.value)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderBottom: `2px solid ${tab === t.value ? "var(--color-accent)" : "transparent"}`,
              background: "transparent",
              color: tab === t.value ? "var(--color-accent-text)" : "var(--color-text-secondary)",
              fontWeight: tab === t.value ? 700 : 400,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </HStack>

      {/* Report content */}
      {tab === "sales" ? (
        <SalesReport from={from} to={to} />
      ) : (
        <CashflowReport from={from} to={to} />
      )}
    </VStack>
  );
}
