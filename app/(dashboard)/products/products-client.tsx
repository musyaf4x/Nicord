"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  TextInput,
  Card,
} from "@astryxdesign/core";
import { Plus, Search, Package } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sellingPrice: string;
  stock: number;
  unit: string;
  isActive: boolean;
  isUnlimited: boolean;
  imageUrl: string | null;
  category?: { id: string; name: string } | null;
}

interface ProductListResponse {
  data: Product[];
  meta: { page: number; limit: number; total: number; pages: number };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useProducts(q: string, active?: boolean) {
  const params = new URLSearchParams({ q, limit: "20" });
  if (active !== undefined) params.set("active", String(active));

  return useQuery<ProductListResponse>({
    queryKey: ["products", q, active],
    queryFn: () => fetch(`/api/products?${params}`).then((r) => r.json()),
  });
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onToggle,
}: {
  product: Product;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const price = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(product.sellingPrice));

  const stockLabel = product.isUnlimited
    ? "Tidak terbatas"
    : `${product.stock} ${product.unit}`;

  return (
    <Card
      style={{
        padding: "var(--spacing-4)",
        cursor: "pointer",
      }}
    >
      <HStack gap={3} align="start">
        {/* Image placeholder */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            background: "var(--color-wash)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Package size={24} style={{ color: "var(--color-text-secondary)" }} />
          )}
        </div>

        <VStack gap={1} style={{ flex: 1, minWidth: 0 }}>
          <HStack justify="between" align="start">
            <Text
              size="base"
              style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {product.name}
            </Text>
            <Badge
              label={product.isActive ? "Aktif" : "Nonaktif"}
              variant={product.isActive ? "success" : "neutral"}
            />
          </HStack>

          <Text size="base" style={{ fontWeight: 700, color: "var(--color-accent-text)" }}>
            {price}
          </Text>

          <HStack gap={3}>
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              Stok: {stockLabel}
            </Text>
            {product.category && (
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                · {product.category.name}
              </Text>
            )}
          </HStack>
        </VStack>
      </HStack>

      <HStack gap={2} style={{ marginTop: "var(--spacing-3)" }}>
        <Button
          label="Edit"
          variant="secondary"
          size="sm"
          as={Link}
          href={`/products/${product.id}/edit`}
          style={{ flex: 1 }}
        />
        <Button
          label={product.isActive ? "Nonaktifkan" : "Aktifkan"}
          variant={product.isActive ? "ghost" : "secondary"}
          size="sm"
          onClick={() => onToggle(product.id, !product.isActive)}
          style={{ flex: 1 }}
          id={`toggle-product-${product.id}`}
        />
      </HStack>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyProducts({ q }: { q: string }) {
  return (
    <VStack align="center" gap={3} style={{ padding: "var(--spacing-12) 0" }}>
      <Package size={40} style={{ color: "var(--color-text-secondary)" }} />
      <VStack align="center" gap={1}>
        <Text size="base" style={{ fontWeight: 600 }}>
          {q ? `Produk "${q}" tidak ditemukan` : "Belum ada produk"}
        </Text>
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          {q ? "Coba kata kunci lain" : "Tambah produk pertamamu"}
        </Text>
      </VStack>
      {!q && (
        <Button
          label="+ Tambah Produk"
          variant="primary"
          as={Link}
          href="/products/new"
          id="add-first-product-btn"
        />
      )}
    </VStack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProductsPageClient() {
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data, isLoading } = useProducts(q, activeFilter);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const filters: { label: string; value: boolean | undefined }[] = [
    { label: "Semua", value: undefined },
    { label: "Aktif", value: true },
    { label: "Nonaktif", value: false },
  ];

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <Heading level={1}>Produk</Heading>
        <Button
          label="+ Tambah"
          variant="primary"
          as={Link}
          href="/products/new"
          id="add-product-btn"
        />
      </HStack>

      {/* Search */}
      <TextInput
        label="Cari produk"
        isLabelHidden
        placeholder="Cari nama produk..."
        value={q}
        onChange={(v) => setQ(v)}
        startIcon={Search as React.ComponentType<React.SVGProps<SVGSVGElement>>}
        hasClear
      />

      {/* Filter tabs */}
      <HStack gap={2}>
        {filters.map((f) => (
          <button
            key={String(f.value)}
            id={`filter-${f.label.toLowerCase()}`}
            onClick={() => setActiveFilter(f.value)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1.5px solid ${activeFilter === f.value ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
              background: activeFilter === f.value ? "var(--color-accent-wash)" : "transparent",
              color: activeFilter === f.value ? "var(--color-accent-text)" : "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: activeFilter === f.value ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </HStack>

      {/* Count */}
      {data && (
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          {data.meta.total} produk
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <VStack gap={3}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 120,
                borderRadius: 12,
                background: "var(--color-wash)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </VStack>
      ) : data?.data.length === 0 ? (
        <EmptyProducts q={q} />
      ) : (
        <VStack gap={3}>
          {data?.data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
