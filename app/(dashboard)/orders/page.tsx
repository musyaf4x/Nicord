import type { Metadata } from "next";
import { OrdersPageClient } from "./orders-client";

export const metadata: Metadata = {
  title: "Order",
  description: "Daftar order usaha kamu",
};

export default function OrdersPage() {
  return <OrdersPageClient />;
}
