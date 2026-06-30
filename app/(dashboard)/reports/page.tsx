import type { Metadata } from "next";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Laporan — Nicord",
  description: "Laporan penjualan dan cashflow usahamu",
};

export default function ReportsPage() {
  return <ReportsClient />;
}
