import type { Metadata } from "next";
import { NewOrderClient } from "./new-order-client";

export const metadata: Metadata = { title: "Buat Order — Nicord" };

export default function NewOrderPage() {
  return <NewOrderClient />;
}
