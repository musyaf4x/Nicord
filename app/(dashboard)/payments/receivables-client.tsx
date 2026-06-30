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
  Card,
  Badge,
} from "@astryxdesign/core";
import { CreditCard, MessageCircle } from "lucide-react";
import {
  PAYMENT_STATUS_META,
  STATUS_META,
  formatRupiah,
  type PaymentStatus,
  type OrderStatus,
} from "@/lib/types/order";

interface ReceivableItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  grandTotal: string;
  amountPaid: string;
  amountDue: string;
  orderDate: string;
  customer: { id: string; name: string; whatsappNumber: string | null };
}

interface ReceivableResponse {
  data: ReceivableItem[];
  meta: { total: number; totalReceivable: number };
}

const AGE_FILTERS = [
  { label: "Semua", value: "" },
  { label: "7+ hari", value: "7" },
  { label: "14+ hari", value: "14" },
  { label: "30+ hari", value: "30" },
];

export function ReceivablesClient() {
  const [ageFilter, setAgeFilter] = useState("");

  const params = new URLSearchParams();
  if (ageFilter) params.set("age", ageFilter);

  const { data, isLoading } = useQuery<ReceivableResponse>({
    queryKey: ["receivables", ageFilter],
    queryFn: () => fetch(`/api/receivables?${params}`).then((r) => r.json()),
  });

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <Heading level={1}>Piutang</Heading>
      </HStack>

      {/* Total receivable summary */}
      {data && (
        <Card
          style={{
            padding: "var(--spacing-5)",
            background: "var(--color-critical-wash)",
            border: "1.5px solid var(--color-critical-border)",
          }}
        >
          <VStack gap={0}>
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              Total Piutang Belum Lunas
            </Text>
            <Text size="base" style={{ fontWeight: 800, color: "var(--color-critical-text)" }}>
              {formatRupiah(data.meta.totalReceivable)}
            </Text>
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
              dari {data.meta.total} order
            </Text>
          </VStack>
        </Card>
      )}

      {/* Age filter */}
      <HStack gap={2}>
        {AGE_FILTERS.map((f) => (
          <button
            key={f.value}
            id={`age-filter-${f.label}`}
            onClick={() => setAgeFilter(f.value)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1.5px solid ${ageFilter === f.value ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
              background: ageFilter === f.value ? "var(--color-accent-wash)" : "transparent",
              color: ageFilter === f.value ? "var(--color-accent-text)" : "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: ageFilter === f.value ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </HStack>

      {/* List */}
      {isLoading ? (
        <VStack gap={3}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                borderRadius: 12,
                background: "var(--color-wash)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </VStack>
      ) : data?.data.length === 0 ? (
        <VStack align="center" gap={3} style={{ padding: "var(--spacing-12) 0" }}>
          <CreditCard size={40} style={{ color: "var(--color-text-secondary)" }} />
          <Text size="base" style={{ fontWeight: 600 }}>
            Tidak ada piutang{ageFilter ? ` ${ageFilter}+ hari` : ""}
          </Text>
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
            Semua order sudah lunas 🎉
          </Text>
        </VStack>
      ) : (
        <VStack gap={3}>
          {data?.data.map((item) => {
            const payMeta = PAYMENT_STATUS_META[item.paymentStatus];
            const statusMeta = STATUS_META[item.status];
            const daysSince = Math.floor(
              (Date.now() - new Date(item.orderDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            const waLink = item.customer.whatsappNumber
              ? `https://wa.me/${item.customer.whatsappNumber}`
              : null;

            return (
              <Card key={item.id} style={{ padding: "var(--spacing-4)" }}>
                <VStack gap={3}>
                  <HStack justify="between" align="start">
                    <VStack gap={0}>
                      <Link
                        href={`/orders/${item.id}`}
                        style={{
                          textDecoration: "none",
                          color: "var(--color-accent-text)",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        #{item.orderNumber}
                      </Link>
                      <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                        {daysSince} hari lalu
                      </Text>
                    </VStack>
                    <Badge label={payMeta.label} variant={payMeta.variant} />
                  </HStack>

                  <HStack justify="between" align="center">
                    <VStack gap={0}>
                      <Text size="sm" style={{ fontWeight: 600 }}>
                        {item.customer.name}
                      </Text>
                      <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                        Sisa: {formatRupiah(item.amountDue)}
                      </Text>
                    </VStack>
                    <HStack gap={2}>
                      {waLink && (
                        <Button
                          label=""
                          variant="ghost"
                          size="sm"
                          as="a"
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          id={`wa-receivable-${item.id}`}
                        >
                          <MessageCircle size={16} />
                        </Button>
                      )}
                      <Button
                        label="Catat Bayar"
                        variant="primary"
                        size="sm"
                        as={Link}
                        href={`/orders/${item.id}`}
                        id={`pay-receivable-${item.id}`}
                      />
                    </HStack>
                  </HStack>
                </VStack>
              </Card>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
