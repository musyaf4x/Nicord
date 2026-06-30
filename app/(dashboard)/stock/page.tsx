import type { Metadata } from "next";
import { StockPageClient } from "./stock-client";

export const metadata: Metadata = {
  title: "Stok — Nicord",
  description: "Kelola stok produk",
};

export default function StockPage() {
  return <StockPageClient />;
}
