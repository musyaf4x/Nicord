"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  VStack,
  HStack,
  Text,
  Button,
  TextInput,
  Card,
  Heading,
} from "@astryxdesign/core";
import { formatRupiah } from "@/lib/types/order";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "QRIS", label: "QRIS" },
  { value: "GOPAY", label: "GoPay" },
  { value: "OVO", label: "OVO" },
  { value: "DANA", label: "DANA" },
  { value: "SHOPEEPAY", label: "ShopeePay" },
  { value: "OTHER", label: "Lainnya" },
];

interface PaymentFormProps {
  orderId: string;
  amountDue: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ orderId, amountDue, onSuccess, onCancel }: PaymentFormProps) {
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState(String(Math.ceil(amountDue)));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          amount: Number(amount),
          notes: notes || undefined,
        }),
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Gagal mencatat pembayaran");
        return body;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      onSuccess?.();
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  return (
    <Card style={{ padding: "var(--spacing-5)" }}>
      <VStack gap={4}>
        <Heading level={2}>Catat Pembayaran</Heading>

        <HStack gap={2} align="center">
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>Sisa tagihan:</Text>
          <Text size="sm" style={{ fontWeight: 700, color: "var(--color-critical-text)" }}>
            {formatRupiah(amountDue)}
          </Text>
        </HStack>

        {/* Method picker */}
        <VStack gap={2}>
          <Text size="sm" style={{ fontWeight: 600 }}>Metode Bayar</Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                id={`payment-method-${m.value}`}
                onClick={() => setMethod(m.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${method === m.value ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
                  background: method === m.value ? "var(--color-accent-wash)" : "transparent",
                  color: method === m.value ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                  fontSize: 13,
                  fontWeight: method === m.value ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {m.label}
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

        <HStack gap={3}>
          {onCancel && (
            <Button label="Batal" variant="ghost" onClick={onCancel} style={{ flex: 1 }} />
          )}
          <Button
            label={isPending ? "Menyimpan..." : "Catat Pembayaran"}
            variant="primary"
            isLoading={isPending}
            onClick={() => mutate()}
            isDisabled={!amount || Number(amount) <= 0}
            style={{ flex: 2 }}
            id="save-payment-btn"
          />
        </HStack>
      </VStack>
    </Card>
  );
}
