import type { Metadata } from "next";
import { ReceivablesClient } from "./receivables-client";

export const metadata: Metadata = {
  title: "Piutang — Nicord",
  description: "Daftar order yang belum lunas",
};

export default function PaymentsPage() {
  return <ReceivablesClient />;
}
