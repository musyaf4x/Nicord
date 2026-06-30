import type { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard — Nicord",
  description: "Ringkasan performa usahamu",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
