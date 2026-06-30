import type { Metadata } from "next";
import { ExpensesClient } from "./expenses-client";

export const metadata: Metadata = {
  title: "Pengeluaran — Nicord",
  description: "Catat dan pantau pengeluaran usaha",
};

export default function ExpensesPage() {
  return <ExpensesClient />;
}
