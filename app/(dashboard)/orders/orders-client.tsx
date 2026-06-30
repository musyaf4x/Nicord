"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  TextInput,
  Card,
  Badge,
} from "@astryxdesign/core";
import { Search, ShoppingCart } from "lucide-react";
import {
  STATUS_META,
  PAYMENT_STATUS_META,
  formatRupiah,
  type OrderStatus,
  type PaymentStatus,
  type OrderListItem,
} from "@/lib/types/order";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderListResponse {
  data: OrderListItem[];
  meta: { page: number; limit: number; total: number; pages: number };
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: OrderStatus | undefined }[] = [
  { label: "Semua", value: undefined },
  { label: "Draft", value: "DRAFT" },
  { label: "Dikonfirmasi", value: "CONFIRMED" },
  { label: "Diproses", value: "PROCESSING" },
  { label: "Siap Kirim", value: "READY" },
  { label: "Selesai", value: "DELIVERED" },
  { label: "Batal", value: "CANCELLED" },
];

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderListItem }) {
  const status = STATUS_META[order.status];
  const payStatus = PAYMENT_STATUS_META[order.paymentStatus];
  const dateLabel = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/orders/${order.id}`} style={{ textDecoration: "none" }}>
      <Card
        style={{
          padding: "var(--spacing-4)",
          transition: "box-shadow 0.15s",
          cursor: "pointer",
        }}
      >
        <VStack gap={2}>
          {/* Top row */}
          <HStack justify="between" align="start">
            <VStack gap={0}>
              <Text size="sm" style={{ fontWeight: 700 }}>
                #{order.orderNumber}
              </Text>
              <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                {dateLabel}
              </Text>
            </VStack>
            <HStack gap={2}>
              <Badge label={status.label} variant={status.variant} />
            </HStack>
          </HStack>

          {/* Customer */}
          <HStack gap={2} align="center">
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              {order.customer.name}
            </Text>
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
              · {order._count.items} item
            </Text>
          </HStack>

          {/* Bottom row */}
          <HStack justify="between" align="center">
            <Badge label={payStatus.label} variant={payStatus.variant} />
            <Text size="sm" style={{ fontWeight: 700, color: "var(--color-accent-text)" }}>
              {formatRupiah(order.grandTotal)}
            </Text>
          </HStack>
        </VStack>
      </Card>
    </Link>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyOrders({ q }: { q: string }) {
  return (
    <VStack align="center" gap={3} style={{ padding: "var(--spacing-12) 0" }}>
      <ShoppingCart size={40} style={{ color: "var(--color-text-secondary)" }} />
      <VStack align="center" gap={1}>
        <Text size="base" style={{ fontWeight: 600 }}>
          {q ? `Order "${q}" tidak ditemukan` : "Belum ada order"}
        </Text>
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          {q ? "Coba kata kunci lain" : "Catat order pertamamu sekarang"}
        </Text>
      </VStack>
      {!q && (
        <Button
          label="+ Buat Order"
          variant="primary"
          as={Link}
          href="/orders/new"
          id="create-first-order-btn"
        />
      )}
    </VStack>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function OrdersPageClient() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);

  const params = new URLSearchParams({ limit: "20" });
  if (q) params.set("q", q);
  if (statusFilter) params.set("status", statusFilter);

  const { data, isLoading } = useQuery<OrderListResponse>({
    queryKey: ["orders", q, statusFilter],
    queryFn: () => fetch(`/api/orders?${params}`).then((r) => r.json()),
  });

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <Heading level={1}>Order</Heading>
        <Button
          label="+ Buat Order"
          variant="primary"
          as={Link}
          href="/orders/new"
          id="new-order-btn"
        />
      </HStack>

      {/* Search */}
      <TextInput
        label="Cari order"
        isLabelHidden
        placeholder="Nomor order atau nama pelanggan..."
        value={q}
        onChange={(v) => setQ(v)}
        startIcon={Search as React.ComponentType<React.SVGProps<SVGSVGElement>>}
        hasClear
      />

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={String(tab.value)}
            id={`order-tab-${tab.label.toLowerCase()}`}
            onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1.5px solid ${statusFilter === tab.value ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
              background: statusFilter === tab.value ? "var(--color-accent-wash)" : "transparent",
              color: statusFilter === tab.value ? "var(--color-accent-text)" : "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: statusFilter === tab.value ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Count */}
      {data && (
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          {data.meta.total} order
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <VStack gap={3}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 110,
                borderRadius: 12,
                background: "var(--color-wash)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </VStack>
      ) : data?.data.length === 0 ? (
        <EmptyOrders q={q} />
      ) : (
        <VStack gap={3}>
          {data?.data.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
