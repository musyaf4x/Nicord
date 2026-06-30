import type { Metadata } from "next";
import { ProductsPageClient } from "./products-client";

export const metadata: Metadata = {
  title: "Produk",
  description: "Kelola produk usaha kamu",
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
