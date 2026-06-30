"use client";

import { useState } from "react";
import {
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Heading,
  Badge,
} from "@astryxdesign/core";
import {
  formatRupiah,
  PAYMENT_STATUS_META,
  CHANNEL_LABEL,
  type OrderDetail,
} from "@/lib/types/order";

// ─── WA message builder ───────────────────────────────────────────────────────

function buildWAMessage(order: OrderDetail, businessName: string): string {
  const dateStr = new Date(order.orderDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemLines = order.items
    .map(
      (item) =>
        `  • ${item.productName} x${item.quantity} = ${formatRupiah(item.subtotal)}`
    )
    .join("\n");

  const discountLine =
    Number(order.discount) > 0
      ? `\nDiskon: -${formatRupiah(order.discount)}`
      : "";
  const shippingLine =
    Number(order.shippingCost) > 0
      ? `\nOngkir: ${formatRupiah(order.shippingCost)}`
      : "";

  const paymentInfo =
    order.paymentStatus === "PAID"
      ? "✅ *LUNAS*"
      : order.paymentStatus === "PARTIAL"
      ? `⚠️ Terbayar: ${formatRupiah(order.amountPaid)}\nSisa: ${formatRupiah(order.amountDue)}`
      : `⏳ Belum bayar\nTotal tagihan: *${formatRupiah(order.grandTotal)}*`;

  return `
🛍️ *NOTA ORDER — ${businessName}*

Nomor: *${order.orderNumber}*
Tanggal: ${dateStr}
Pelanggan: ${order.customer.name}

*Detail Pesanan:*
${itemLines}
——————————————
Subtotal: ${formatRupiah(order.subtotal)}${discountLine}${shippingLine}
*TOTAL: ${formatRupiah(order.grandTotal)}*

*Status Pembayaran:*
${paymentInfo}

${order.notes ? `📝 Catatan: ${order.notes}\n` : ""}
Terima kasih sudah berbelanja! 🙏
`.trim();
}

// ─── Invoice Panel ────────────────────────────────────────────────────────────

interface InvoicePanelProps {
  order: OrderDetail;
  businessName: string;
}

export function InvoicePanel({ order, businessName }: InvoicePanelProps) {
  const [copied, setCopied] = useState(false);

  const waMessage = buildWAMessage(order, businessName);
  const payStatus = PAYMENT_STATUS_META[order.paymentStatus];

  async function handleCopyWA() {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = waMessage;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const waLink = order.customer.whatsappNumber
    ? `https://wa.me/${order.customer.whatsappNumber}?text=${encodeURIComponent(waMessage)}`
    : null;

  return (
    <Card style={{ padding: "var(--spacing-4)" }}>
      <VStack gap={4}>
        <HStack justify="between" align="center">
          <Heading level={2}>Invoice</Heading>
          <Badge label={payStatus.label} variant={payStatus.variant} />
        </HStack>

        {/* Invoice summary */}
        <VStack gap={2}>
          {/* Items */}
          {order.items.map((item) => (
            <HStack key={item.id} justify="between" align="start">
              <VStack gap={0} style={{ flex: 1 }}>
                <Text size="sm">{item.productName}</Text>
                <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                  {formatRupiah(item.unitPrice)} × {item.quantity}
                </Text>
              </VStack>
              <Text size="sm" style={{ fontWeight: 600 }}>
                {formatRupiah(item.subtotal)}
              </Text>
            </HStack>
          ))}

          <div style={{ borderTop: "1px dashed var(--color-border-default)", margin: "4px 0" }} />

          <HStack justify="between">
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Subtotal</Text>
            <Text size="sm">{formatRupiah(order.subtotal)}</Text>
          </HStack>
          {Number(order.discount) > 0 && (
            <HStack justify="between">
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Diskon</Text>
              <Text size="sm" style={{ color: "var(--color-critical-text)" }}>
                − {formatRupiah(order.discount)}
              </Text>
            </HStack>
          )}
          {Number(order.shippingCost) > 0 && (
            <HStack justify="between">
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Ongkir</Text>
              <Text size="sm">{formatRupiah(order.shippingCost)}</Text>
            </HStack>
          )}

          <div style={{ borderTop: "1.5px solid var(--color-border-default)", paddingTop: 8 }}>
            <HStack justify="between">
              <Text size="sm" style={{ fontWeight: 700 }}>Total</Text>
              <Text size="base" style={{ fontWeight: 800, color: "var(--color-accent-text)" }}>
                {formatRupiah(order.grandTotal)}
              </Text>
            </HStack>
          </div>

          {order.paymentStatus !== "PAID" && (
            <HStack justify="between">
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Sisa Tagihan</Text>
              <Text size="sm" style={{ fontWeight: 700, color: "var(--color-critical-text)" }}>
                {formatRupiah(order.amountDue)}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Payment history */}
        {order.payments.length > 0 && (
          <VStack gap={2}>
            <Text size="sm" style={{ fontWeight: 600 }}>Riwayat Pembayaran</Text>
            {order.payments.map((p) => (
              <HStack key={p.id} justify="between" align="center">
                <VStack gap={0}>
                  <Text size="sm">{p.method}</Text>
                  <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(p.paidAt).toLocaleDateString("id-ID")}
                  </Text>
                </VStack>
                <Text size="sm" style={{ fontWeight: 600, color: "var(--color-success-text)" }}>
                  +{formatRupiah(p.amount)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}

        {/* WA actions */}
        <VStack gap={2}>
          <Button
            label={copied ? "✓ Tersalin!" : "Copy Pesan WA"}
            variant={copied ? "secondary" : "primary"}
            onClick={handleCopyWA}
            style={{ width: "100%" }}
            id="copy-wa-btn"
          />
          {waLink && (
            <Button
              label="Kirim via WhatsApp"
              variant="ghost"
              as="a"
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: "100%" }}
              id="send-wa-btn"
            />
          )}
        </VStack>
      </VStack>
    </Card>
  );
}
