// Shared types for Order domain

export type OrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

export type OrderChannel =
  | "WHATSAPP"
  | "INSTAGRAM"
  | "TIKTOK"
  | "MARKETPLACE"
  | "OFFLINE"
  | "OTHER";

export interface OrderCustomer {
  id: string;
  name: string;
  whatsappNumber: string | null;
  address?: string | null;
}

export interface OrderProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  unit: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  product?: OrderProduct;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  grandTotal: string;
  amountDue: string;
  orderDate: string;
  createdAt: string;
  customer: OrderCustomer;
  _count: { items: number };
}

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  notes: string | null;
  changedAt: string;
  changedBy: string;
}

export interface Payment {
  id: string;
  method: string;
  amount: string;
  paidAt: string;
  notes: string | null;
}

export interface OrderDetail extends OrderListItem {
  subtotal: string;
  discount: string;
  shippingCost: string;
  amountPaid: string;
  notes: string | null;
  deliveryDate: string | null;
  channel: OrderChannel;
  items: OrderItem[];
  payments: Payment[];
  statusHistory: OrderStatusHistory[];
  invoice: { id: string; invoiceNumber: string; publicSlug: string | null } | null;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    variant: "neutral" | "info" | "warning" | "success" | "error";
    next: OrderStatus[];
    nextLabel: Record<OrderStatus, string>;
    color: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    variant: "neutral",
    next: ["CONFIRMED", "CANCELLED"],
    nextLabel: { CONFIRMED: "Konfirmasi", CANCELLED: "Batalkan" } as any,
    color: "var(--color-text-secondary)",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    variant: "info",
    next: ["PROCESSING", "CANCELLED"],
    nextLabel: { PROCESSING: "Proses", CANCELLED: "Batalkan" } as any,
    color: "var(--color-info-text)",
  },
  PROCESSING: {
    label: "Diproses",
    variant: "warning",
    next: ["READY", "CANCELLED"],
    nextLabel: { READY: "Siap Kirim", CANCELLED: "Batalkan" } as any,
    color: "var(--color-warning-text)",
  },
  READY: {
    label: "Siap Kirim",
    variant: "info",
    next: ["DELIVERED", "CANCELLED"],
    nextLabel: { DELIVERED: "Selesai", CANCELLED: "Batalkan" } as any,
    color: "var(--color-info-text)",
  },
  DELIVERED: {
    label: "Selesai",
    variant: "success",
    next: [],
    nextLabel: {} as any,
    color: "var(--color-success-text)",
  },
  CANCELLED: {
    label: "Dibatalkan",
    variant: "error",
    next: [],
    nextLabel: {} as any,
    color: "var(--color-critical-text)",
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; variant: "neutral" | "info" | "warning" | "success" | "error" }
> = {
  UNPAID: { label: "Belum Bayar", variant: "error" },
  PARTIAL: { label: "Bayar Sebagian", variant: "warning" },
  PAID: { label: "Lunas", variant: "success" },
  REFUNDED: { label: "Refund", variant: "neutral" },
};

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  MARKETPLACE: "Marketplace",
  OFFLINE: "Offline",
  OTHER: "Lainnya",
};

export function formatRupiah(n: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}
