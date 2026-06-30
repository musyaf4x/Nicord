"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ProductStock {
  id: string;
  name: string;
  stock: number;
  unit: string;
  isUnlimited: boolean;
  imageUrl: string | null;
}

interface StockAdjustFormProps {
  product: ProductStock;
  onSuccess: () => void;
  onCancel: () => void;
}

// LOW_STOCK_THRESHOLD default = 5
const LOW_STOCK = 5;

function StockAdjustForm({ product, onSuccess, onCancel }: StockAdjustFormProps) {
  const [adjustType, setAdjustType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT">("ADJUSTMENT_IN");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustType,
          quantity: Number(quantity),
          notes: notes || undefined,
        }),
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Gagal menyesuaikan stok");
        return body;
      }),
    onSuccess: () => {
      setError(null);
      onSuccess();
    },
    onError: (e: Error) => setError(e.message),
  });

  const previewStock =
    adjustType === "ADJUSTMENT_IN"
      ? product.stock + (Number(quantity) || 0)
      : product.stock - (Number(quantity) || 0);

  return (
    <Card style={{ padding: "var(--spacing-4)", border: "2px solid var(--color-accent-border)" }}>
      <VStack gap={3}>
        <HStack justify="between" align="center">
          <Text size="sm" style={{ fontWeight: 700 }}>{product.name}</Text>
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
            Stok: {product.stock} {product.unit}
          </Text>
        </HStack>

        {/* Type picker */}
        <HStack gap={2}>
          <button
            id="adj-in-btn"
            onClick={() => setAdjustType("ADJUSTMENT_IN")}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 8,
              border: `1.5px solid ${adjustType === "ADJUSTMENT_IN" ? "var(--color-success-border)" : "var(--color-border-default)"}`,
              background: adjustType === "ADJUSTMENT_IN" ? "var(--color-success-wash)" : "transparent",
              color: adjustType === "ADJUSTMENT_IN" ? "var(--color-success-text)" : "var(--color-text-secondary)",
              fontWeight: adjustType === "ADJUSTMENT_IN" ? 600 : 400,
              cursor: "pointer", fontSize: 13,
            }}
          >
            ↑ Tambah Stok
          </button>
          <button
            id="adj-out-btn"
            onClick={() => setAdjustType("ADJUSTMENT_OUT")}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 8,
              border: `1.5px solid ${adjustType === "ADJUSTMENT_OUT" ? "var(--color-critical-border)" : "var(--color-border-default)"}`,
              background: adjustType === "ADJUSTMENT_OUT" ? "var(--color-critical-wash)" : "transparent",
              color: adjustType === "ADJUSTMENT_OUT" ? "var(--color-critical-text)" : "var(--color-text-secondary)",
              fontWeight: adjustType === "ADJUSTMENT_OUT" ? 600 : 400,
              cursor: "pointer", fontSize: 13,
            }}
          >
            ↓ Kurangi Stok
          </button>
        </HStack>

        <TextInput
          label="Jumlah"
          type="text"
          value={quantity}
          onChange={(v) => setQuantity(v)}
          placeholder="1"
        />

        <TextInput
          label="Catatan"
          value={notes}
          onChange={(v) => setNotes(v)}
          placeholder="Alasan penyesuaian (opsional)"
          isOptional
        />

        {/* Preview */}
        <HStack gap={2} align="center" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--color-wash)" }}>
          <Text size="sm" style={{ color: "var(--color-text-secondary)", flex: 1 }}>
            Stok setelah:
          </Text>
          <Text
            size="sm"
            style={{
              fontWeight: 700,
              color: previewStock < 0 ? "var(--color-critical-text)" : "var(--color-text-primary)",
            }}
          >
            {previewStock} {product.unit}
          </Text>
        </HStack>

        {error && (
          <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
            {error}
          </Text>
        )}

        <HStack gap={2}>
          <Button label="Batal" variant="ghost" onClick={onCancel} style={{ flex: 1 }} />
          <Button
            label={isPending ? "Menyimpan..." : "Simpan"}
            variant="primary"
            isLoading={isPending}
            onClick={() => mutate()}
            isDisabled={!quantity || Number(quantity) <= 0 || previewStock < 0}
            style={{ flex: 2 }}
            id="save-stock-btn"
          />
        </HStack>
      </VStack>
    </Card>
  );
}

// ─── Product Stock Card ───────────────────────────────────────────────────────

function StockCard({
  product,
  onAdjust,
}: {
  product: ProductStock;
  onAdjust: () => void;
}) {
  const isLow = !product.isUnlimited && product.stock <= LOW_STOCK;

  return (
    <Card style={{ padding: "var(--spacing-4)" }}>
      <HStack justify="between" align="center">
        <HStack gap={3} align="center">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--color-wash)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={18} style={{ color: "var(--color-text-secondary)" }} />
          </div>
          <VStack gap={0}>
            <HStack gap={2} align="center">
              <Text size="sm" style={{ fontWeight: 600 }}>
                {product.name}
              </Text>
              {isLow && (
                <AlertTriangle size={14} style={{ color: "var(--color-warning-text)" }} />
              )}
            </HStack>
            {product.isUnlimited ? (
              <Badge label="Unlimited" variant="neutral" />
            ) : (
              <Text
                size="xsm"
                style={{
                  color: isLow ? "var(--color-critical-text)" : "var(--color-text-secondary)",
                  fontWeight: isLow ? 700 : 400,
                }}
              >
                {product.stock} {product.unit}
                {isLow ? " — Stok menipis!" : ""}
              </Text>
            )}
          </VStack>
        </HStack>
        {!product.isUnlimited && (
          <Button
            label="Sesuaikan"
            variant="secondary"
            size="sm"
            onClick={onAdjust}
            id={`adjust-stock-${product.id}`}
          />
        )}
      </HStack>
    </Card>
  );
}

// ─── Main Stock Page ──────────────────────────────────────────────────────────

export function StockPageClient() {
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: ProductStock[] }>({
    queryKey: ["products-stock"],
    queryFn: () =>
      fetch("/api/products?limit=100&active=true").then((r) => r.json()),
  });

  const products = data?.data ?? [];
  const lowStockProducts = products.filter((p) => !p.isUnlimited && p.stock <= LOW_STOCK);
  const adjustingProduct = products.find((p) => p.id === adjustingId);

  return (
    <VStack gap={4}>
      <Heading level={1}>Stok</Heading>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <Card
          style={{
            padding: "var(--spacing-4)",
            background: "var(--color-warning-wash)",
            border: "1.5px solid var(--color-warning-border)",
          }}
        >
          <HStack gap={2} align="center">
            <AlertTriangle size={16} style={{ color: "var(--color-warning-text)" }} />
            <Text size="sm" style={{ fontWeight: 600, color: "var(--color-warning-text)" }}>
              {lowStockProducts.length} produk stok menipis (≤ {LOW_STOCK})
            </Text>
          </HStack>
        </Card>
      )}

      {/* Adjust form */}
      {adjustingProduct && (
        <StockAdjustForm
          product={adjustingProduct}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["products-stock"] });
            setAdjustingId(null);
          }}
          onCancel={() => setAdjustingId(null)}
        />
      )}

      {/* Product list */}
      {isLoading ? (
        <VStack gap={3}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 12,
                background: "var(--color-wash)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </VStack>
      ) : (
        <VStack gap={3}>
          {products.length === 0 ? (
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              Belum ada produk. Tambahkan di menu Produk.
            </Text>
          ) : (
            products.map((p) => (
              <StockCard
                key={p.id}
                product={p}
                onAdjust={() => setAdjustingId(adjustingId === p.id ? null : p.id)}
              />
            ))
          )}
        </VStack>
      )}
    </VStack>
  );
}
