"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  VStack, HStack, Heading, Text, Button, TextInput, Card,
} from "@astryxdesign/core";
import { Plus, Trash2, Receipt } from "lucide-react";
import { formatRupiah } from "@/lib/types/order";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  BAHAN_BAKU:   { label: "Bahan Baku",   color: "#f97316" },
  PACKAGING:    { label: "Packaging",     color: "#8b5cf6" },
  ONGKIR:       { label: "Ongkir",        color: "#06b6d4" },
  IKLAN:        { label: "Iklan",         color: "#ec4899" },
  OPERASIONAL:  { label: "Operasional",   color: "#64748b" },
  GAJI:         { label: "Gaji",          color: "#10b981" },
  LAIN_LAIN:    { label: "Lain-lain",     color: "#94a3b8" },
};

interface Expense {
  id: string;
  category: string;
  amount: string;
  date: string;
  notes: string | null;
}

interface ExpenseData {
  data: Expense[];
  meta: { total: number };
  categoryTotals: { category: string; _sum: { amount: string | null } }[];
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const [category, setCategory] = useState("BAHAN_BAKU");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: Number(amount), date, notes: notes || undefined }),
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Gagal menyimpan");
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAmount(""); setNotes(""); setError(null);
      onSuccess();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Card style={{ padding: "var(--spacing-5)", border: "2px solid var(--color-accent-border)" }}>
      <VStack gap={4}>
        <Heading level={2}>Tambah Pengeluaran</Heading>

        {/* Category picker */}
        <VStack gap={2}>
          <Text size="sm" style={{ fontWeight: 600 }}>Kategori</Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(CATEGORIES).map(([val, meta]) => (
              <button
                key={val}
                id={`cat-${val}`}
                onClick={() => setCategory(val)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${category === val ? meta.color : "var(--color-border-default)"}`,
                  background: category === val ? `${meta.color}22` : "transparent",
                  color: category === val ? meta.color : "var(--color-text-secondary)",
                  fontWeight: category === val ? 700 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </VStack>

        <TextInput
          label="Nominal (Rp)"
          type="text"
          value={amount}
          onChange={(v) => setAmount(v)}
          placeholder="0"
        />

        <VStack gap={1}>
          <Text size="sm" style={{ fontWeight: 600 }}>Tanggal</Text>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1.5px solid var(--color-border-default)",
              background: "transparent", color: "var(--color-text-primary)",
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </VStack>

        <TextInput
          label="Catatan"
          value={notes}
          onChange={(v) => setNotes(v)}
          placeholder="Opsional"
          isOptional
        />

        {error && (
          <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
            {error}
          </Text>
        )}

        <Button
          label={isPending ? "Menyimpan..." : "Simpan Pengeluaran"}
          variant="primary"
          isLoading={isPending}
          onClick={() => mutate()}
          isDisabled={!amount || Number(amount) <= 0}
          id="save-expense-btn"
        />
      </VStack>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ExpensesClient() {
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState("");
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (catFilter) params.set("category", catFilter);

  const { data, isLoading } = useQuery<ExpenseData>({
    queryKey: ["expenses", catFilter],
    queryFn: () => fetch(`/api/expenses?${params}`).then((r) => r.json()),
  });

  const { mutate: deleteExpense } = useMutation({
    mutationFn: (id: string) => fetch(`/api/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const totalInPeriod = data?.data.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

  return (
    <VStack gap={4}>
      {/* Header */}
      <HStack justify="between" align="center">
        <Heading level={1}>Pengeluaran</Heading>
        <Button
          label={showForm ? "Tutup" : "Tambah"}
          variant={showForm ? "secondary" : "primary"}
          onClick={() => setShowForm((v) => !v)}
          id="toggle-expense-form"
        >
          {!showForm && <Plus size={16} />}
        </Button>
      </HStack>

      {showForm && <AddExpenseForm onSuccess={() => setShowForm(false)} />}

      {/* Summary total */}
      {data && (
        <Card style={{
          padding: "var(--spacing-4)",
          background: "var(--color-warning-wash)",
          border: "1.5px solid var(--color-warning-border)",
        }}>
          <HStack justify="between" align="center">
            <VStack gap={0}>
              <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>Total pengeluaran</Text>
              <Text size="base" style={{ fontWeight: 800, color: "var(--color-warning-text)" }}>
                {formatRupiah(totalInPeriod)}
              </Text>
            </VStack>
            <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
              {data.meta.total} transaksi
            </Text>
          </HStack>
        </Card>
      )}

      {/* Category filter */}
      <HStack gap={2} style={{ flexWrap: "wrap" }}>
        <button
          key="all"
          onClick={() => setCatFilter("")}
          style={{
            padding: "6px 14px", borderRadius: 20,
            border: `1.5px solid ${!catFilter ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
            background: !catFilter ? "var(--color-accent-wash)" : "transparent",
            color: !catFilter ? "var(--color-accent-text)" : "var(--color-text-secondary)",
            fontWeight: !catFilter ? 600 : 400, fontSize: 13, cursor: "pointer",
          }}
        >
          Semua
        </button>
        {Object.entries(CATEGORIES).map(([val, meta]) => (
          <button
            key={val}
            onClick={() => setCatFilter(val)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: `1.5px solid ${catFilter === val ? meta.color : "var(--color-border-default)"}`,
              background: catFilter === val ? `${meta.color}22` : "transparent",
              color: catFilter === val ? meta.color : "var(--color-text-secondary)",
              fontWeight: catFilter === val ? 700 : 400, fontSize: 13, cursor: "pointer",
            }}
          >
            {meta.label}
          </button>
        ))}
      </HStack>

      {/* Expense list */}
      {isLoading ? (
        <VStack gap={3}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: "var(--color-wash)", animation: "pulse 1.5s infinite" }} />
          ))}
        </VStack>
      ) : data?.data.length === 0 ? (
        <VStack align="center" gap={3} style={{ padding: "var(--spacing-12) 0" }}>
          <Receipt size={40} style={{ color: "var(--color-text-secondary)" }} />
          <Text size="base" style={{ fontWeight: 600 }}>Belum ada pengeluaran</Text>
          <Button label="Tambah Sekarang" variant="primary" onClick={() => setShowForm(true)} />
        </VStack>
      ) : (
        <VStack gap={2}>
          {data?.data.map((expense) => {
            const cat = CATEGORIES[expense.category] ?? { label: expense.category, color: "#94a3b8" };
            return (
              <Card key={expense.id} style={{ padding: "var(--spacing-4)" }}>
                <HStack justify="between" align="center">
                  <HStack gap={3} align="center">
                    <div
                      style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: cat.color, flexShrink: 0,
                      }}
                    />
                    <VStack gap={0}>
                      <HStack gap={2} align="center">
                        <Text size="sm" style={{ fontWeight: 600 }}>{cat.label}</Text>
                        <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                          {format(new Date(expense.date), "d MMM yyyy", { locale: localeId })}
                        </Text>
                      </HStack>
                      {expense.notes && (
                        <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                          {expense.notes}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <HStack gap={3} align="center">
                    <Text size="sm" style={{ fontWeight: 700 }}>
                      {formatRupiah(expense.amount)}
                    </Text>
                    <button
                      id={`delete-expense-${expense.id}`}
                      onClick={() => {
                        if (confirm("Hapus pengeluaran ini?")) deleteExpense(expense.id);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      <Trash2 size={15} style={{ color: "var(--color-critical-text)" }} />
                    </button>
                  </HStack>
                </HStack>
              </Card>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
