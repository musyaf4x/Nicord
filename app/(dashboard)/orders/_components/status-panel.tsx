"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
} from "@astryxdesign/core";
import {
  STATUS_META,
  type OrderStatus,
  type OrderDetail,
} from "@/lib/types/order";

interface StatusPanelProps {
  order: OrderDetail;
  onUpdated: () => void;
}

const STATUS_CONFIRM_MSG: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Yakin ingin membatalkan order ini? Stok akan dikembalikan.",
  CONFIRMED: "Konfirmasi order ini? Stok akan dikurangi.",
};

export function StatusPanel({ order, onUpdated }: StatusPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (nextStatus: OrderStatus) =>
      fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Gagal update status");
        return body;
      }),
    onSuccess: () => {
      setError(null);
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ["order", order.id] });
      onUpdated();
    },
    onError: (e: Error) => {
      setError(e.message);
      setConfirming(null);
    },
  });

  const meta = STATUS_META[order.status];
  const nextStatuses = meta.next as OrderStatus[];

  return (
    <Card style={{ padding: "var(--spacing-4)" }}>
      <VStack gap={3}>
        <HStack justify="between" align="center">
          <Text size="sm" style={{ fontWeight: 700 }}>Status Order</Text>
          <Badge label={meta.label} variant={meta.variant} />
        </HStack>

        {/* Status timeline */}
        <VStack gap={2}>
          {order.statusHistory.map((h, i) => {
            const hMeta = STATUS_META[h.status];
            return (
              <HStack key={h.id} gap={3} align="start">
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--color-accent-text)",
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  {i < order.statusHistory.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 20,
                        background: "var(--color-border-default)",
                        marginTop: 2,
                      }}
                    />
                  )}
                </div>
                <VStack gap={0} style={{ paddingBottom: i < order.statusHistory.length - 1 ? 8 : 0 }}>
                  <Text size="sm" style={{ fontWeight: 600 }}>
                    {hMeta.label}
                  </Text>
                  <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(h.changedAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {h.notes && (
                    <Text size="xsm" style={{ color: "var(--color-text-secondary)" }}>
                      {h.notes}
                    </Text>
                  )}
                </VStack>
              </HStack>
            );
          })}
        </VStack>

        {error && (
          <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
            {error}
          </Text>
        )}

        {/* Confirm dialog */}
        {confirming && (
          <Card style={{ padding: "var(--spacing-3)", background: "var(--color-warning-wash)" }}>
            <VStack gap={2}>
              <Text size="sm" style={{ fontWeight: 600 }}>
                {STATUS_CONFIRM_MSG[confirming] ?? `Ubah status ke ${STATUS_META[confirming].label}?`}
              </Text>
              <HStack gap={2}>
                <Button
                  label="Batal"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Ya, Lanjutkan"
                  variant="primary"
                  size="sm"
                  isLoading={isPending}
                  onClick={() => updateStatus(confirming)}
                  style={{ flex: 2 }}
                  id={`confirm-status-${confirming}`}
                />
              </HStack>
            </VStack>
          </Card>
        )}

        {/* Action buttons */}
        {nextStatuses.length > 0 && !confirming && (
          <HStack gap={2}>
            {nextStatuses.map((next) => {
              const isCancel = next === "CANCELLED";
              const label = meta.nextLabel[next] ?? STATUS_META[next].label;
              return (
                <Button
                  key={next}
                  label={label}
                  variant={isCancel ? "ghost" : "primary"}
                  size="sm"
                  isLoading={isPending}
                  onClick={() => {
                    if (STATUS_CONFIRM_MSG[next]) {
                      setConfirming(next);
                    } else {
                      updateStatus(next);
                    }
                  }}
                  style={{ flex: 1 }}
                  id={`status-btn-${next}`}
                />
              );
            })}
          </HStack>
        )}
      </VStack>
    </Card>
  );
}
