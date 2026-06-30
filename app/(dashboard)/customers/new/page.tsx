import type { Metadata } from "next";
import { CustomerForm } from "../_components/customer-form";

export const metadata: Metadata = { title: "Tambah Pelanggan" };

export default function NewCustomerPage() {
  return <CustomerForm />;
}
