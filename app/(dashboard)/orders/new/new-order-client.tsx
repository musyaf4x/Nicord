"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import Link from "next/link";
import {
  VStack,
  HStack,
  Card,
  Heading,
  Text,
  Button,
  TextInput,
  Badge,
} from "@astryxdesign/core";
import { Search, Plus, Trash2, Package, Users } from "lucide-react";
import { formatRupiah, CHANNEL_LABEL, type OrderChannel } from "@/lib/types/order";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomerOption {
  id: string;
  name: string;
  whatsappNumber: string | null;
  _count: { orders: number };
}

interface ProductOption {
  id: string;
  name: string;
  sellingPrice: string;
  stock: number;
  unit: string;
  isUnlimited: boolean;
  imageUrl: string | null;
}

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  unit: string;
  quantity: number;
}

interface OrderFormData {
  customerId: string;
  customerName: string;
  cart: CartItem[];
  channel: OrderChannel;
  deliveryDate: string;
  discount: string;
  shippingCost: string;
  notes: string;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({
  current,
  steps,
}: {
  current: number;
  steps: string[];
}) {
  return (
    <HStack gap={0} style={{ marginBottom: "var(--spacing-4)" }}>
      {steps.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <VStack align="center" gap={1} style={{ flex: 1 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  i < current
                    ? "var(--color-accent-text)"
                    : i === current
                    ? "var(--color-accent-border)"
                    : "var(--color-border-default)",
                color: i <= current ? "white" : "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                transition: "all 0.2s",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <Text
              size="xsm"
              style={{
                color:
                  i === current
                    ? "var(--color-accent-text)"
                    : "var(--color-text-secondary)",
                fontWeight: i === current ? 600 : 400,
              }}
            >
              {label}
            </Text>
          </VStack>
          {i < steps.length - 1 && (
            <div
              style={{
                height: 2,
                flex: 1,
                background:
                  i < current
                    ? "var(--color-accent-border)"
                    : "var(--color-border-default)",
                marginBottom: 20,
                transition: "all 0.2s",
              }}
            />
          )}
        </div>
      ))}
    </HStack>
  );
}

// ─── Step 1: Customer Selector ────────────────────────────────────────────────

function CustomerStep({
  value,
  onChange,
  onNext,
}: {
  value: { id: string; name: string };
  onChange: (c: { id: string; name: string }) => void;
  onNext: () => void;
}) {
  const [q, setQ] = useState("");

  const { data: customerData } = useQuery<{ data: CustomerOption[] }>({
    queryKey: ["customers-search", q],
    queryFn: () =>
      fetch(`/api/customers?q=${encodeURIComponent(q)}&limit=10`).then((r) =>
        r.json()
      ),
  });

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>Pilih Pelanggan</Heading>
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          Cari pelanggan yang sudah ada atau tambah baru.
        </Text>
      </VStack>

      <TextInput
        label="Cari pelanggan"
        isLabelHidden
        placeholder="Nama atau nomor WA..."
        value={q}
        onChange={(v) => setQ(v)}
        startIcon={Search as React.ComponentType<React.SVGProps<SVGSVGElement>>}
        hasClear
      />

      {/* Selected */}
      {value.id && (
        <HStack
          gap={2}
          align="center"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--color-accent-wash)",
            border: "2px solid var(--color-accent-border)",
          }}
        >
          <Users size={16} style={{ color: "var(--color-accent-text)" }} />
          <Text size="sm" style={{ fontWeight: 600, color: "var(--color-accent-text)", flex: 1 }}>
            {value.name}
          </Text>
          <button
            onClick={() => onChange({ id: "", name: "" })}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <Text size="xsm" style={{ color: "var(--color-accent-text)" }}>✕</Text>
          </button>
        </HStack>
      )}

      {/* Customer list */}
      <VStack gap={2}>
        {customerData?.data.map((c) => (
          <button
            key={c.id}
            id={`select-customer-${c.id}`}
            onClick={() => {
              onChange({ id: c.id, name: c.name });
              setQ("");
            }}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: `1.5px solid ${value.id === c.id ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
              background: value.id === c.id ? "var(--color-accent-wash)" : "transparent",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <HStack justify="between" align="center">
              <VStack gap={0}>
                <Text size="sm" style={{ fontWeight: 600 }}>{c.name}</Text>
                {c.whatsappNumber && (
                  <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                    {c.whatsappNumber}
                  </Text>
                )}
              </VStack>
              {c._count.orders > 0 && (
                <Badge label={`${c._count.orders}x`} variant="blue" />
              )}
            </HStack>
          </button>
        ))}
      </VStack>

      <Button
        label="+ Pelanggan Baru"
        variant="ghost"
        as={Link}
        href="/customers/new"
        id="new-customer-from-order"
      />

      <Button
        label="Lanjut →"
        variant="primary"
        onClick={onNext}
        isDisabled={!value.id}
        id="order-step1-next"
      />
    </VStack>
  );
}

// ─── Step 2: Product Cart ─────────────────────────────────────────────────────

function ProductStep({
  cart,
  onCartChange,
  onNext,
  onBack,
}: {
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [q, setQ] = useState("");

  const { data: productData } = useQuery<{ data: ProductOption[] }>({
    queryKey: ["products-search", q],
    queryFn: () =>
      fetch(`/api/products?q=${encodeURIComponent(q)}&active=true&limit=10`).then(
        (r) => r.json()
      ),
  });

  function addToCart(product: ProductOption) {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      onCartChange(
        cart.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      onCartChange([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: Number(product.sellingPrice),
          unit: product.unit,
          quantity: 1,
        },
      ]);
    }
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      onCartChange(cart.filter((i) => i.productId !== productId));
    } else {
      onCartChange(cart.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>Tambah Produk</Heading>
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          Cari dan tambahkan produk ke order.
        </Text>
      </VStack>

      {/* Search */}
      <TextInput
        label="Cari produk"
        isLabelHidden
        placeholder="Nama produk..."
        value={q}
        onChange={(v) => setQ(v)}
        startIcon={Search as React.ComponentType<React.SVGProps<SVGSVGElement>>}
        hasClear
      />

      {/* Product results */}
      {productData && q && (
        <VStack gap={2}>
          {productData.data.map((p) => (
            <HStack
              key={p.id}
              justify="between"
              align="center"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1.5px solid var(--color-border-default)",
              }}
            >
              <VStack gap={0} style={{ flex: 1 }}>
                <Text size="sm" style={{ fontWeight: 600 }}>{p.name}</Text>
                <Text size="xsm" style={{ color: "var(--color-accent-text)" }}>
                  {formatRupiah(p.sellingPrice)} / {p.unit}
                </Text>
                {!p.isUnlimited && (
                  <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                    Stok: {p.stock}
                  </Text>
                )}
              </VStack>
              <Button
                label="+ Tambah"
                variant="secondary"
                size="sm"
                onClick={() => { addToCart(p); setQ(""); }}
                id={`add-product-${p.id}`}
              />
            </HStack>
          ))}
          {productData.data.length === 0 && (
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              Produk tidak ditemukan
            </Text>
          )}
        </VStack>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <VStack gap={3}>
          <Text size="sm" style={{ fontWeight: 600 }}>
            Keranjang ({cart.length} produk)
          </Text>
          {cart.map((item) => (
            <Card key={item.productId} style={{ padding: "var(--spacing-3)" }}>
              <VStack gap={2}>
                <HStack justify="between" align="start">
                  <VStack gap={0} style={{ flex: 1 }}>
                    <Text size="sm" style={{ fontWeight: 600 }}>{item.productName}</Text>
                    <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                      {formatRupiah(item.unitPrice)} / {item.unit}
                    </Text>
                  </VStack>
                  <button
                    onClick={() => updateQty(item.productId, 0)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    id={`remove-cart-${item.productId}`}
                  >
                    <Trash2 size={16} style={{ color: "var(--color-critical-text)" }} />
                  </button>
                </HStack>
                <HStack justify="between" align="center">
                  <HStack gap={2} align="center">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: "1.5px solid var(--color-border-default)",
                        background: "transparent", cursor: "pointer", fontSize: 18,
                      }}
                      id={`dec-qty-${item.productId}`}
                    >
                      −
                    </button>
                    <Text size="sm" style={{ fontWeight: 700, minWidth: 28, textAlign: "center" }}>
                      {item.quantity}
                    </Text>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: "1.5px solid var(--color-border-default)",
                        background: "transparent", cursor: "pointer", fontSize: 18,
                      }}
                      id={`inc-qty-${item.productId}`}
                    >
                      +
                    </button>
                  </HStack>
                  <Text size="sm" style={{ fontWeight: 700, color: "var(--color-accent-text)" }}>
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </Text>
                </HStack>
              </VStack>
            </Card>
          ))}

          {/* Subtotal */}
          <HStack justify="between" style={{ padding: "8px 0", borderTop: "1.5px solid var(--color-border-default)" }}>
            <Text size="sm" style={{ fontWeight: 600 }}>Subtotal</Text>
            <Text size="sm" style={{ fontWeight: 700, color: "var(--color-accent-text)" }}>
              {formatRupiah(subtotal)}
            </Text>
          </HStack>
        </VStack>
      )}

      <HStack gap={3}>
        <Button label="← Kembali" variant="ghost" onClick={onBack} style={{ flex: 1 }} />
        <Button
          label="Lanjut →"
          variant="primary"
          onClick={onNext}
          isDisabled={cart.length === 0}
          style={{ flex: 2 }}
          id="order-step2-next"
        />
      </HStack>
    </VStack>
  );
}

// ─── Step 3: Order Details ────────────────────────────────────────────────────

function DetailsStep({
  cart,
  onSubmit,
  onBack,
  loading,
}: {
  cart: CartItem[];
  onSubmit: (data: {
    channel: OrderChannel;
    deliveryDate: string;
    discount: string;
    shippingCost: string;
    notes: string;
  }) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [channel, setChannel] = useState<OrderChannel>("WHATSAPP");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [notes, setNotes] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountNum = Number(discount) || 0;
  const shippingNum = Number(shippingCost) || 0;
  const grandTotal = subtotal - discountNum + shippingNum;

  const channels = Object.entries(CHANNEL_LABEL) as [OrderChannel, string][];

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>Detail Order</Heading>
        <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
          Lengkapi info pengiriman dan total akhir.
        </Text>
      </VStack>

      {/* Channel */}
      <VStack gap={2}>
        <Text size="sm" style={{ fontWeight: 600 }}>Channel Pesanan</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {channels.map(([key, label]) => (
            <button
              key={key}
              id={`channel-${key}`}
              onClick={() => setChannel(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1.5px solid ${channel === key ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
                background: channel === key ? "var(--color-accent-wash)" : "transparent",
                color: channel === key ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                fontSize: 13,
                fontWeight: channel === key ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </VStack>

      <VStack gap={1}>
        <Text size="sm" style={{ fontWeight: 600 }}>Tanggal Kirim <Text size="xsm" display="inline" style={{ color: "var(--color-text-secondary)" }}>(opsional)</Text></Text>
        <input
          type="date"
          id="delivery-date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1.5px solid var(--color-border-default)",
            background: "transparent",
            color: "var(--color-text-primary)",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </VStack>

      <HStack gap={3}>
        <TextInput
          label="Diskon (Rp)"
          type="text"
          placeholder="0"
          value={discount}
          onChange={(v) => setDiscount(v)}
        />
        <TextInput
          label="Ongkir (Rp)"
          type="text"
          placeholder="0"
          value={shippingCost}
          onChange={(v) => setShippingCost(v)}
        />
      </HStack>

      <TextInput
        label="Catatan"
        placeholder="Catatan untuk pembeli (opsional)"
        value={notes}
        onChange={(v) => setNotes(v)}
        isOptional
      />

      {/* Order summary */}
      <Card style={{ padding: "var(--spacing-4)", background: "var(--color-wash)" }}>
        <VStack gap={2}>
          <Text size="sm" style={{ fontWeight: 700 }}>Ringkasan Order</Text>
          <HStack justify="between">
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Subtotal</Text>
            <Text size="sm">{formatRupiah(subtotal)}</Text>
          </HStack>
          {discountNum > 0 && (
            <HStack justify="between">
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Diskon</Text>
              <Text size="sm" style={{ color: "var(--color-critical-text)" }}>
                − {formatRupiah(discountNum)}
              </Text>
            </HStack>
          )}
          {shippingNum > 0 && (
            <HStack justify="between">
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Ongkir</Text>
              <Text size="sm">{formatRupiah(shippingNum)}</Text>
            </HStack>
          )}
          <div style={{ borderTop: "1.5px solid var(--color-border-default)", paddingTop: 8 }}>
            <HStack justify="between">
              <Text size="sm" style={{ fontWeight: 700 }}>Total</Text>
              <Text size="base" style={{ fontWeight: 800, color: "var(--color-accent-text)" }}>
                {formatRupiah(grandTotal)}
              </Text>
            </HStack>
          </div>
        </VStack>
      </Card>

      <HStack gap={3}>
        <Button label="← Kembali" variant="ghost" onClick={onBack} style={{ flex: 1 }} />
        <Button
          label={loading ? "Menyimpan..." : "Buat Order"}
          variant="primary"
          isLoading={loading}
          onClick={() => onSubmit({ channel, deliveryDate, discount, shippingCost, notes })}
          style={{ flex: 2 }}
          id="create-order-btn"
        />
      </HStack>
    </VStack>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

const STEPS = ["Pelanggan", "Produk", "Detail"];

export function NewOrderClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState({ id: "", name: "" });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(details: {
    channel: OrderChannel;
    deliveryDate: string;
    discount: string;
    shippingCost: string;
    notes: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          channel: details.channel,
          deliveryDate: details.deliveryDate || null,
          discount: Number(details.discount) || 0,
          shippingCost: Number(details.shippingCost) || 0,
          notes: details.notes || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Gagal membuat order");
        return;
      }

      router.push(`/orders/${body.id}`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack gap={4}>
      <HStack align="center" gap={3}>
        <Button label="← Kembali" variant="ghost" as={Link} href="/orders" />
        <Heading level={1}>Buat Order</Heading>
      </HStack>

      <Card style={{ padding: "var(--spacing-6)" }}>
        <VStack gap={4}>
          <StepIndicator current={step} steps={STEPS} />

          {error && (
            <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
              {error}
            </Text>
          )}

          {step === 0 && (
            <CustomerStep
              value={customer}
              onChange={setCustomer}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <ProductStep
              cart={cart}
              onCartChange={setCart}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <DetailsStep
              cart={cart}
              onSubmit={handleSubmit}
              onBack={() => setStep(1)}
              loading={loading}
            />
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
