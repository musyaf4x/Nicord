"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { VStack, HStack, Button, TextInput, Text, Heading } from "@astryxdesign/core";

const customerSchema = z.object({
  name: z.string().min(1, "Nama pelanggan wajib diisi"),
  whatsappNumber: z
    .string()
    .regex(/^62\d{8,13}$/, "Format: 628xxxxxxxxx (contoh: 6281234567890)")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customerId?: string;
  defaultValues?: Partial<CustomerFormValues>;
}

export function CustomerForm({ customerId, defaultValues }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!customerId;

  const { control, handleSubmit } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      whatsappNumber: "",
      address: "",
      notes: "",
      ...defaultValues,
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.name,
        whatsappNumber: data.whatsappNumber || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined,
      };

      const res = await fetch(
        isEdit ? `/api/customers/${customerId}` : "/api/customers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const body = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(`Nomor WA sudah terdaftar. ${body.error}`);
        } else {
          setError(body.error ?? "Gagal menyimpan pelanggan");
        }
        return;
      }

      router.push(isEdit ? `/customers/${customerId}` : "/customers");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack gap={4}>
      <HStack align="center" gap={3}>
        <Button
          label="← Kembali"
          variant="ghost"
          as={Link}
          href="/customers"
        />
        <Heading level={1}>{isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}</Heading>
      </HStack>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <VStack gap={4}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Nama pelanggan"
                placeholder="Contoh: Ani Wulandari"
                value={field.value}
                onChange={(v) => field.onChange(v)}
                status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
                isRequired
              />
            )}
          />

          <Controller
            name="whatsappNumber"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Nomor WhatsApp"
                placeholder="628xxxxxxxxx"
                htmlName="whatsapp"
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
                description="Format internasional: 628xxxxxxxxx"
                isOptional
              />
            )}
          />

          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Alamat"
                placeholder="Jl. Merdeka No. 1, Jakarta"
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                isOptional
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Catatan"
                placeholder="Contoh: Pelanggan loyal, suka diskon"
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                isOptional
              />
            )}
          />

          {error && (
            <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
              {error}
            </Text>
          )}

          <HStack gap={3}>
            <Button
              label="Batal"
              variant="ghost"
              as={Link}
              href="/customers"
              style={{ flex: 1 }}
            />
            <Button
              label={isEdit ? "Simpan Perubahan" : "Simpan Pelanggan"}
              type="submit"
              variant="primary"
              isLoading={loading}
              style={{ flex: 2 }}
              id="save-customer-btn"
            />
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}
