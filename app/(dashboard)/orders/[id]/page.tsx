import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  Badge,
} from "@astryxdesign/core";
import {
  STATUS_META,
  PAYMENT_STATUS_META,
  CHANNEL_LABEL,
  formatRupiah,
  type OrderDetail,
} from "@/lib/types/order";
import { StatusPanel } from "../_components/status-panel";
import { InvoicePanel } from "../_components/invoice-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  return { title: order ? `#${order.orderNumber}` : "Detail Order" };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session?.user?.id ?? "" } } },
    },
    include: {
      customer: { select: { id: true, name: true, whatsappNumber: true, address: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true, unit: true } },
        },
      },
      payments: { orderBy: { paidAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
      invoice: true,
      business: { select: { name: true } },
    },
  });

  if (!order) notFound();

  const statusMeta = STATUS_META[order.status as keyof typeof STATUS_META];
  const payMeta = PAYMENT_STATUS_META[order.paymentStatus as keyof typeof PAYMENT_STATUS_META];

  // Serialize Decimal fields for client components
  const serialized: OrderDetail = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as any,
    paymentStatus: order.paymentStatus as any,
    channel: order.channel as any,
    grandTotal: String(order.grandTotal),
    subtotal: String(order.subtotal),
    discount: String(order.discount),
    shippingCost: String(order.shippingCost),
    amountPaid: String(order.amountPaid),
    amountDue: String(order.amountDue),
    notes: order.notes,
    deliveryDate: order.deliveryDate?.toISOString() ?? null,
    orderDate: order.orderDate.toISOString(),
    createdAt: order.createdAt.toISOString(),
    customer: order.customer,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: String(item.unitPrice),
      quantity: item.quantity,
      subtotal: String(item.subtotal),
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        unit: item.product.unit,
      } : undefined,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: String(p.amount),
      paidAt: p.paidAt.toISOString(),
      notes: p.notes,
    })),
    statusHistory: order.statusHistory.map((h) => ({
      id: h.id,
      status: h.status as any,
      notes: h.notes,
      changedAt: h.changedAt.toISOString(),
      changedBy: h.changedBy,
    })),
    invoice: order.invoice
      ? {
          id: order.invoice.id,
          invoiceNumber: order.invoice.invoiceNumber,
          publicSlug: order.invoice.publicSlug,
        }
      : null,
    _count: { items: order.items.length },
  };

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <HStack align="center" gap={3}>
          <Button label="← Kembali" variant="ghost" as={Link} href="/orders" />
          <VStack gap={0}>
            <Heading level={1}>#{order.orderNumber}</Heading>
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
              {new Date(order.createdAt).toLocaleString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
              {" · "}
              {CHANNEL_LABEL[order.channel as keyof typeof CHANNEL_LABEL]}
            </Text>
          </VStack>
        </HStack>
        <Badge label={statusMeta.label} variant={statusMeta.variant} />
      </HStack>

      {/* Customer info */}
      <Card style={{ padding: "var(--spacing-4)" }}>
        <HStack justify="between" align="start">
          <VStack gap={1}>
            <Text size="sm" style={{ fontWeight: 700 }}>{order.customer.name}</Text>
            {order.customer.whatsappNumber && (
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                {order.customer.whatsappNumber}
              </Text>
            )}
            {order.customer.address && (
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                {order.customer.address}
              </Text>
            )}
            {order.deliveryDate && (
              <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                Kirim: {new Date(order.deliveryDate).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </Text>
            )}
          </VStack>
          <Button
            label="Lihat Pelanggan"
            variant="ghost"
            size="sm"
            as={Link}
            href={`/customers/${order.customer.id}`}
          />
        </HStack>
      </Card>

      {/* Status panel — client component for interactivity */}
      <StatusPanel order={serialized} onUpdated={() => {}} />

      {/* Invoice panel — client component */}
      <InvoicePanel order={serialized} businessName={order.business.name} />

      {/* Notes */}
      {order.notes && (
        <Card style={{ padding: "var(--spacing-4)" }}>
          <VStack gap={1}>
            <Text size="sm" style={{ fontWeight: 700 }}>Catatan</Text>
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              {order.notes}
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}
