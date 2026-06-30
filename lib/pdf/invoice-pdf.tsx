import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 40,
    color: "#1a1a2e",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 24,
  },
  businessName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 2,
  },
  businessMeta: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 1,
  },
  divider: {
    borderBottom: "1.5px solid #e2e8f0",
    marginVertical: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#64748b",
    fontSize: 10,
  },
  value: {
    fontWeight: "bold",
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: "6px 8px",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "6px 8px",
    borderBottom: "0.5px solid #e2e8f0",
  },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colSubtotal: { flex: 2, textAlign: "right" },
  colLabelText: { fontSize: 9, color: "#64748b", fontWeight: "bold" },
  colText: { fontSize: 10 },
  totalsSection: {
    marginTop: 12,
    padding: "12px 8px",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1.5px solid #6366f1",
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#6366f1",
  },
  badge: {
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 9,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 9,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoicePDFProps {
  order: {
    orderNumber: string;
    orderDate: string;
    status: string;
    paymentStatus: string;
    channel: string;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    discount: number;
    shippingCost: number;
    notes: string | null;
    items: {
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
    customer: {
      name: string;
      whatsappNumber: string | null;
      address: string | null;
    };
  };
  business: {
    name: string;
    whatsappNumber: string | null;
    address: string | null;
  };
}

function formatRp(n: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(n))}`;
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function InvoicePDF({ order, business }: InvoicePDFProps) {
  const subtotal = order.items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <Document
      title={`Invoice ${order.orderNumber}`}
      author={business.name}
    >
      <Page size="A4" style={s.page}>
        {/* Business header */}
        <View style={s.header}>
          <Text style={s.businessName}>{business.name}</Text>
          {business.whatsappNumber && (
            <Text style={s.businessMeta}>WA: {business.whatsappNumber}</Text>
          )}
          {business.address && (
            <Text style={s.businessMeta}>{business.address}</Text>
          )}
        </View>

        {/* Invoice info */}
        <View style={s.divider} />
        <View style={{ marginBottom: 16 }}>
          <View style={s.row}>
            <Text style={s.label}>No. Invoice</Text>
            <Text style={[s.value, { color: "#6366f1" }]}>#{order.orderNumber}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Tanggal</Text>
            <Text style={s.value}>
              {format(new Date(order.orderDate), "d MMMM yyyy", { locale: localeId })}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Channel</Text>
            <Text style={s.value}>{order.channel}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Status Bayar</Text>
            <Text style={[s.value, {
              color: order.paymentStatus === "PAID" ? "#10b981"
                : order.paymentStatus === "PARTIAL" ? "#f59e0b"
                : "#ef4444"
            }]}>
              {order.paymentStatus === "PAID" ? "LUNAS"
                : order.paymentStatus === "PARTIAL" ? "BAYAR SEBAGIAN"
                : "BELUM BAYAR"}
            </Text>
          </View>
        </View>

        {/* Customer info */}
        <View style={[s.divider]} />
        <Text style={s.sectionTitle}>Pelanggan</Text>
        <View style={{ marginBottom: 16 }}>
          <View style={s.row}>
            <Text style={s.label}>Nama</Text>
            <Text style={s.value}>{order.customer.name}</Text>
          </View>
          {order.customer.whatsappNumber && (
            <View style={s.row}>
              <Text style={s.label}>WhatsApp</Text>
              <Text style={s.value}>{order.customer.whatsappNumber}</Text>
            </View>
          )}
          {order.customer.address && (
            <View style={s.row}>
              <Text style={s.label}>Alamat</Text>
              <Text style={[s.value, { flex: 2, textAlign: "right" }]}>{order.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Items table */}
        <View style={s.divider} />
        <Text style={s.sectionTitle}>Detail Pesanan</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colProduct, s.colLabelText]}>Produk</Text>
          <Text style={[s.colQty, s.colLabelText]}>Qty</Text>
          <Text style={[s.colPrice, s.colLabelText]}>Harga</Text>
          <Text style={[s.colSubtotal, s.colLabelText]}>Subtotal</Text>
        </View>
        {order.items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.colProduct, s.colText]}>{item.productName}</Text>
            <Text style={[s.colQty, s.colText]}>{item.quantity}</Text>
            <Text style={[s.colPrice, s.colText]}>{formatRp(item.unitPrice)}</Text>
            <Text style={[s.colSubtotal, s.colText]}>{formatRp(item.subtotal)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totalsSection}>
          <View style={s.totalRow}>
            <Text style={s.label}>Subtotal</Text>
            <Text style={s.value}>{formatRp(subtotal)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={s.totalRow}>
              <Text style={s.label}>Diskon</Text>
              <Text style={[s.value, { color: "#10b981" }]}>- {formatRp(order.discount)}</Text>
            </View>
          )}
          {order.shippingCost > 0 && (
            <View style={s.totalRow}>
              <Text style={s.label}>Ongkos Kirim</Text>
              <Text style={s.value}>+ {formatRp(order.shippingCost)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalText}>TOTAL</Text>
            <Text style={s.grandTotalText}>{formatRp(order.grandTotal)}</Text>
          </View>
          {order.amountPaid > 0 && (
            <>
              <View style={[s.totalRow, { marginTop: 8 }]}>
                <Text style={s.label}>Sudah Dibayar</Text>
                <Text style={[s.value, { color: "#10b981" }]}>{formatRp(order.amountPaid)}</Text>
              </View>
              {order.amountDue > 0 && (
                <View style={s.totalRow}>
                  <Text style={[s.label, { color: "#ef4444" }]}>Sisa Tagihan</Text>
                  <Text style={[s.value, { color: "#ef4444" }]}>{formatRp(order.amountDue)}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Notes */}
        {order.notes && (
          <>
            <View style={s.divider} />
            <Text style={s.label}>Catatan: {order.notes}</Text>
          </>
        )}

        {/* Footer */}
        <Text style={s.footer}>
          Terima kasih atas kepercayaannya! — {business.name}
          {"\n"}Invoice dibuat oleh Nicord
        </Text>
      </Page>
    </Document>
  );
}
