import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  VStack,
  HStack,
  Card,
  Heading,
  Text,
  Button,
  Badge,
} from "@astryxdesign/core";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: customer?.name ?? "Detail Pelanggan" };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session?.user?.id ?? "" } } },
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          grandTotal: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) notFound();

  const statusLabel: Record<string, { label: string; variant: "neutral" | "info" | "warning" | "success" | "error" }> = {
    PENDING: { label: "Pending", variant: "neutral" },
    CONFIRMED: { label: "Dikonfirmasi", variant: "info" },
    PROCESSING: { label: "Diproses", variant: "warning" },
    SHIPPED: { label: "Dikirim", variant: "info" },
    DELIVERED: { label: "Selesai", variant: "success" },
    CANCELLED: { label: "Dibatal", variant: "error" },
  };

  const totalSpent = customer.orders.reduce(
    (sum, o) => sum + Number(o.grandTotal),
    0
  );

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <HStack align="center" gap={3}>
          <Button label="← Kembali" variant="ghost" as={Link} href="/customers" />
          <Heading level={1}>{customer.name}</Heading>
        </HStack>
        <Button
          label="Edit"
          variant="secondary"
          as={Link}
          href={`/customers/${customer.id}/edit`}
          id="edit-customer-btn"
        />
      </HStack>

      {/* Info Card */}
      <Card style={{ padding: "var(--spacing-4)" }}>
        <VStack gap={3}>
          <Heading level={2}>Info Pelanggan</Heading>
          {customer.whatsappNumber && (
            <HStack gap={2} align="center">
              <Text size="sm" style={{ color: "var(--color-text-secondary)", minWidth: 80 }}>
                WhatsApp
              </Text>
              <Text size="sm">{customer.whatsappNumber}</Text>
              <a
                href={`https://wa.me/${customer.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-accent-text)", fontSize: 13, marginLeft: 4 }}
              >
                Chat →
              </a>
            </HStack>
          )}
          {customer.address && (
            <HStack gap={2} align="start">
              <Text size="sm" style={{ color: "var(--color-text-secondary)", minWidth: 80 }}>
                Alamat
              </Text>
              <Text size="sm">{customer.address}</Text>
            </HStack>
          )}
          {customer.notes && (
            <HStack gap={2} align="start">
              <Text size="sm" style={{ color: "var(--color-text-secondary)", minWidth: 80 }}>
                Catatan
              </Text>
              <Text size="sm">{customer.notes}</Text>
            </HStack>
          )}
        </VStack>
      </Card>

      {/* Stats */}
      <HStack gap={3}>
        <Card style={{ padding: "var(--spacing-4)", flex: 1 }}>
          <VStack gap={0}>
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Total Order</Text>
            <Text size="lg" style={{ fontWeight: 700 }}>{customer._count.orders}</Text>
          </VStack>
        </Card>
        <Card style={{ padding: "var(--spacing-4)", flex: 1 }}>
          <VStack gap={0}>
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Total Belanja</Text>
            <Text size="base" style={{ fontWeight: 700, color: "var(--color-accent-text)" }}>
              {formatCurrency(totalSpent)}
            </Text>
          </VStack>
        </Card>
      </HStack>

      {/* Order History */}
      {customer.orders.length > 0 && (
        <VStack gap={3}>
          <Heading level={2}>Riwayat Order</Heading>
          {customer.orders.map((order) => {
            const status = statusLabel[order.status] ?? { label: order.status, variant: "neutral" as const };
            return (
              <Card key={order.id} style={{ padding: "var(--spacing-3)" }}>
                <HStack justify="between" align="center">
                  <VStack gap={0}>
                    <Text size="sm" style={{ fontWeight: 600 }}>
                      #{order.orderNumber}
                    </Text>
                    <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </Text>
                  </VStack>
                  <HStack gap={3} align="center">
                    <Text size="sm" style={{ fontWeight: 600 }}>
                      {formatCurrency(Number(order.grandTotal))}
                    </Text>
                    <Badge label={status.label} variant={status.variant} />
                  </HStack>
                </HStack>
              </Card>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
