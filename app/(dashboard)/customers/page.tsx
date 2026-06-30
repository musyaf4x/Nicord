import type { Metadata } from "next";
import { CustomersPageClient } from "./customers-client";

export const metadata: Metadata = {
  title: "Pelanggan",
  description: "Kelola data pelanggan usaha kamu",
};

export default function CustomersPage() {
  return <CustomersPageClient />;
}
