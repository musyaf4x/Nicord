"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  VStack, HStack, Heading, Text, Card,
} from "@astryxdesign/core";
import {
  TrendingUp, ShoppingCart, AlertTriangle, CreditCard,
  TrendingDown, Wallet, Package,
} from "lucide-react";
import { formatRupiah, STATUS_META, type OrderStatus } from "@/lib/types/order";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const PERIODS = [
  { label: "Hari Ini", value: "today" },
  { label: "Minggu Ini", value: "week" },
  { label: "Bulan Ini", value: "month" },
] as const;
type Period = typeof PERIODS[number]["value"];

interface DashboardData {
  period: Period;
  periodRange: { from: string; to: string };
  metrics: {
    omzet: number;
    cashCollected: number;
    totalOrders: number;
    totalReceivable: number;
    totalExpenses: number;
    hpp: number;
    estimasiLaba: number;
  };
  statusBreakdown: Record<string, number>;
  topProducts: { productId: string; productName: string; totalQty: number; totalRevenue: number }[];
  lowStockProducts: { id: string; name: string; stock: number; unit: string }[];
  expenseByCategory: Record<string, number>;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  href?: string;
}) {
  const content = (
    <Card
      style={{
        padding: "var(--spacing-4)",
        borderLeft: `4px solid ${color}`,
        transition: "transform 0.15s ease",
      }}
      className="metric-card"
    >
      <HStack justify="between" align="start">
        <VStack gap={1}>
          <Text size="xsm" style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            {label}
          </Text>
          <Text size="lg" style={{ fontWeight: 800, color: "var(--color-text-primary)" }}>
            {value}
          </Text>
          {sub && (
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
              {sub}
            </Text>
          )}
        </VStack>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${color}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon style={{ color, width: 20, height: 20 }} />
        </div>
      </HStack>
    </Card>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{content}</Link>;
  }
  return content;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: "var(--color-wash)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

// ─── Dashboard Client ─────────────────────────────────────────────────────────

export function DashboardClient() {
  const [period, setPeriod] = useState<Period>("month");

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", period],
    queryFn: () => fetch(`/api/dashboard?period=${period}`).then((r) => r.json()),
    staleTime: 60_000,
  });

  const m = data?.metrics;
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "";

  return (
    <VStack gap={5}>
      {/* Header */}
      <HStack justify="between" align="center">
        <VStack gap={0}>
          <Heading level={1}>Dashboard</Heading>
          {data && (
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
              {format(new Date(data.periodRange.from), "d MMM", { locale: localeId })}
              {" — "}
              {format(new Date(data.periodRange.to), "d MMM yyyy", { locale: localeId })}
            </Text>
          )}
        </VStack>

        {/* Period switcher */}
        <HStack gap={2}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              id={`period-${p.value}`}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1.5px solid ${period === p.value ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
                background: period === p.value ? "var(--color-accent-wash)" : "transparent",
                color: period === p.value ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                fontWeight: period === p.value ? 700 : 400,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </HStack>
      </HStack>

      {/* Primary metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--spacing-3)",
        }}
      >
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} />)
        ) : (
          <>
            <MetricCard
              label={`Omzet ${periodLabel}`}
              value={formatRupiah(m?.omzet ?? 0)}
              sub={`${m?.totalOrders ?? 0} order`}
              icon={TrendingUp}
              color="#10b981"
              href="/reports"
            />
            <MetricCard
              label="Kas Masuk"
              value={formatRupiah(m?.cashCollected ?? 0)}
              sub="Sudah dibayar"
              icon={Wallet}
              color="#3b82f6"
            />
            <MetricCard
              label="Piutang"
              value={formatRupiah(m?.totalReceivable ?? 0)}
              sub="Belum lunas"
              icon={CreditCard}
              color="#f59e0b"
              href="/payments"
            />
            <MetricCard
              label={`Pengeluaran ${periodLabel}`}
              value={formatRupiah(m?.totalExpenses ?? 0)}
              icon={TrendingDown}
              color="#ef4444"
              href="/expenses"
            />
          </>
        )}
      </div>

      {/* Estimasi laba */}
      {!isLoading && m && (
        <Card
          style={{
            padding: "var(--spacing-5)",
            background: m.estimasiLaba >= 0 ? "var(--color-success-wash)" : "var(--color-critical-wash)",
            border: `1.5px solid ${m.estimasiLaba >= 0 ? "var(--color-success-border)" : "var(--color-critical-border)"}`,
          }}
        >
          <HStack justify="between" align="center">
            <VStack gap={0}>
              <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                Estimasi Laba Kasar {periodLabel}
              </Text>
              <Text
                size="lg"
                style={{
                  fontWeight: 800,
                  color: m.estimasiLaba >= 0 ? "var(--color-success-text)" : "var(--color-critical-text)",
                }}
              >
                {m.estimasiLaba >= 0 ? "+" : ""}{formatRupiah(m.estimasiLaba)}
              </Text>
              <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                Kas masuk − Pengeluaran − HPP (Rp{formatRupiah(m.hpp)})
              </Text>
            </VStack>
            <TrendingUp
              size={32}
              style={{ color: m.estimasiLaba >= 0 ? "var(--color-success-text)" : "var(--color-critical-text)" }}
            />
          </HStack>
        </Card>
      )}

      {/* Status breakdown */}
      {!isLoading && data && Object.keys(data.statusBreakdown).length > 0 && (
        <VStack gap={3}>
          <Text size="sm" style={{ fontWeight: 700 }}>Status Order</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--spacing-2)" }}>
            {Object.entries(data.statusBreakdown).map(([status, count]) => {
              const meta = STATUS_META[status as OrderStatus];
              if (!meta) return null;
              return (
                <Card key={status} style={{ padding: "var(--spacing-3)", textAlign: "center" }}>
                  <VStack gap={0} align="center">
                    <Text size="lg" style={{ fontWeight: 800 }}>{count}</Text>
                    <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>{meta.label}</Text>
                  </VStack>
                </Card>
              );
            })}
          </div>
        </VStack>
      )}

      {/* Top products */}
      {!isLoading && data && data.topProducts.length > 0 && (
        <VStack gap={3}>
          <HStack justify="between" align="center">
            <Text size="sm" style={{ fontWeight: 700 }}>Produk Terlaris</Text>
            <Link href="/reports" style={{ fontSize: 13, color: "var(--color-accent-text)", textDecoration: "none" }}>
              Lihat laporan →
            </Link>
          </HStack>
          <VStack gap={2}>
            {data.topProducts.map((p, i) => (
              <HStack key={p.productId} justify="between" align="center">
                <HStack gap={3} align="center">
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: "var(--color-accent-wash)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--color-accent-text)",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <Text size="sm">{p.productName}</Text>
                </HStack>
                <VStack gap={0} style={{ textAlign: "right" }}>
                  <Text size="sm" style={{ fontWeight: 700 }}>{p.totalQty}×</Text>
                  <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                    {formatRupiah(p.totalRevenue)}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </VStack>
      )}

      {/* Low stock alert */}
      {!isLoading && data && data.lowStockProducts.length > 0 && (
        <Card
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-warning-wash)",
            border: "1.5px solid var(--color-warning-border)",
          }}
        >
          <VStack gap={3}>
            <HStack gap={2} align="center">
              <AlertTriangle size={16} style={{ color: "var(--color-warning-text)" }} />
              <Text size="sm" style={{ fontWeight: 700, color: "var(--color-warning-text)" }}>
                Stok Menipis ({data.lowStockProducts.length} produk)
              </Text>
            </HStack>
            <VStack gap={1}>
              {data.lowStockProducts.map((p) => (
                <HStack key={p.id} justify="between">
                  <Text size="sm">{p.name}</Text>
                  <Text size="sm" style={{ fontWeight: 700, color: "var(--color-critical-text)" }}>
                    {p.stock} {p.unit}
                  </Text>
                </HStack>
              ))}
            </VStack>
            <Link
              href="/stock"
              style={{ fontSize: 13, color: "var(--color-warning-text)", textDecoration: "none", fontWeight: 600 }}
            >
              Sesuaikan stok →
            </Link>
          </VStack>
        </Card>
      )}

      {/* No data state */}
      {!isLoading && data?.metrics.totalOrders === 0 && (
        <VStack align="center" gap={3} style={{ padding: "var(--spacing-10) 0" }}>
          <ShoppingCart size={40} style={{ color: "var(--color-text-secondary)" }} />
          <Text size="base" style={{ fontWeight: 600 }}>
            Belum ada order {periodLabel.toLowerCase()}
          </Text>
          <Link
            href="/orders/new"
            style={{
              padding: "10px 20px", borderRadius: 10,
              background: "var(--color-accent)", color: "#fff",
              textDecoration: "none", fontWeight: 600, fontSize: 14,
            }}
          >
            Buat Order Pertama
          </Link>
        </VStack>
      )}
    </VStack>
  );
}
