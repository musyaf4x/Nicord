"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  TextInput,
  Card,
  Badge,
} from "@astryxdesign/core";
import { Search, Users, ShoppingCart } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  whatsappNumber: string | null;
  address: string | null;
  notes: string | null;
  _count: { orders: number };
}

interface CustomerListResponse {
  data: Customer[];
  meta: { page: number; limit: number; total: number };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function useCustomers(q: string) {
  const params = new URLSearchParams({ q, limit: "20" });
  return useQuery<CustomerListResponse>({
    queryKey: ["customers", q],
    queryFn: () => fetch(`/api/customers?${params}`).then((r) => r.json()),
  });
}

// ─── Customer Card ────────────────────────────────────────────────────────────

function CustomerCard({ customer }: { customer: Customer }) {
  const waHref = customer.whatsappNumber
    ? `https://wa.me/${customer.whatsappNumber}`
    : undefined;

  return (
    <Card style={{ padding: "var(--spacing-4)" }}>
      <VStack gap={2}>
        <HStack justify="between" align="start">
          <VStack gap={0}>
            <Text size="base" style={{ fontWeight: 600 }}>
              {customer.name}
            </Text>
            {customer.whatsappNumber && (
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                {customer.whatsappNumber}
              </Text>
            )}
          </VStack>
          {customer._count.orders > 0 && (
            <Badge label={`${customer._count.orders} order`} variant="blue" />
          )}
        </HStack>

        {customer.address && (
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
            📍 {customer.address}
          </Text>
        )}

        <HStack gap={2}>
          <Button
            label="Detail"
            variant="secondary"
            size="sm"
            as={Link}
            href={`/customers/${customer.id}`}
            style={{ flex: 1 }}
          />
          {waHref && (
            <Button
              label="Chat WA"
              variant="ghost"
              size="sm"
              as="a"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1 }}
              id={`wa-${customer.id}`}
            />
          )}
        </HStack>
      </VStack>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyCustomers({ q }: { q: string }) {
  return (
    <VStack align="center" gap={3} style={{ padding: "var(--spacing-12) 0" }}>
      <Users size={40} style={{ color: "var(--color-text-secondary)" }} />
      <VStack align="center" gap={1}>
        <Text size="base" style={{ fontWeight: 600 }}>
          {q ? `Pelanggan "${q}" tidak ditemukan` : "Belum ada pelanggan"}
        </Text>
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          {q ? "Coba nama atau nomor WA lain" : "Tambah pelanggan pertamamu"}
        </Text>
      </VStack>
      {!q && (
        <Button
          label="+ Tambah Pelanggan"
          variant="primary"
          as={Link}
          href="/customers/new"
          id="add-first-customer-btn"
        />
      )}
    </VStack>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CustomersPageClient() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useCustomers(q);

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <Heading level={1}>Pelanggan</Heading>
        <Button
          label="+ Tambah"
          variant="primary"
          as={Link}
          href="/customers/new"
          id="add-customer-btn"
        />
      </HStack>

      {/* Search */}
      <TextInput
        label="Cari pelanggan"
        isLabelHidden
        placeholder="Cari nama atau nomor WA..."
        value={q}
        onChange={(v) => setQ(v)}
        startIcon={Search as React.ComponentType<React.SVGProps<SVGSVGElement>>}
        hasClear
      />

      {/* Count */}
      {data && (
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          {data.meta.total} pelanggan
        </Text>
      )}

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
        <EmptyCustomers q={q} />
      ) : (
        <VStack gap={3}>
          {data?.data.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
