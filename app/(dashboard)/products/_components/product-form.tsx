"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { VStack, HStack, Button, TextInput, Text, Heading } from "@astryxdesign/core";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  sellingPrice: z
    .string()
    .min(1, "Harga wajib diisi")
    .transform((v) => Number(v.replace(/\D/g, "")))
    .refine((v) => v > 0, "Harga harus lebih dari 0"),
  costPrice: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(/\D/g, "")) : undefined)),
  stock: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0))
    .refine((v) => !isNaN(v) && v >= 0, "Stok tidak boleh negatif"),
  unit: z.string().default("pcs"),
  isUnlimited: z.boolean().default(false),
});

type ProductForm = {
  name: string;
  description?: string;
  sellingPrice: string;
  costPrice?: string;
  stock?: string;
  unit: string;
  isUnlimited: boolean;
};

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<ProductForm>;
}

export function ProductForm({ productId, defaultValues }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!productId;

  const { control, handleSubmit, watch } = useForm<ProductForm>({
    defaultValues: {
      name: "",
      description: "",
      sellingPrice: "",
      costPrice: "",
      stock: "0",
      unit: "pcs",
      isUnlimited: false,
      ...defaultValues,
    },
  });

  const isUnlimited = watch("isUnlimited");

  async function onSubmit(raw: ProductForm) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: raw.name,
        description: raw.description || undefined,
        sellingPrice: Number(raw.sellingPrice.replace(/\D/g, "")),
        costPrice: raw.costPrice ? Number(raw.costPrice.replace(/\D/g, "")) : undefined,
        stock: raw.isUnlimited ? 0 : parseInt(raw.stock ?? "0", 10),
        unit: raw.unit,
        isUnlimited: raw.isUnlimited,
        isActive: true,
      };

      const res = await fetch(
        isEdit ? `/api/products/${productId}` : "/api/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Gagal menyimpan produk");
        return;
      }

      router.push("/products");
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
          href="/products"
        />
        <Heading level={1}>{isEdit ? "Edit Produk" : "Tambah Produk"}</Heading>
      </HStack>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <VStack gap={4}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Nama produk"
                placeholder="Contoh: Kaos Polos Putih"
                value={field.value}
                onChange={(v) => field.onChange(v)}
                status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
                isRequired
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Deskripsi"
                placeholder="Deskripsi singkat produk (opsional)"
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                isOptional
              />
            )}
          />

          <Controller
            name="sellingPrice"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Harga jual"
                type="text"
                placeholder="50000"
                htmlName="sellingPrice"
                value={field.value}
                onChange={(v) => field.onChange(v)}
                status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
                isRequired
              />
            )}
          />

          <Controller
            name="costPrice"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Harga modal"
                type="text"
                placeholder="30000"
                htmlName="costPrice"
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                isOptional
                description="Digunakan untuk hitung margin keuntungan"
              />
            )}
          />

          <HStack gap={3}>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="Satuan"
                  placeholder="pcs"
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />

            {!isUnlimited && (
              <Controller
                name="stock"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    label="Stok awal"
                    type="text"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
                  />
                )}
              />
            )}
          </HStack>

          <Controller
            name="isUnlimited"
            control={control}
            render={({ field }) => (
              <label
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                htmlFor="is-unlimited"
              >
                <input
                  id="is-unlimited"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <VStack gap={0}>
                  <Text size="sm" style={{ fontWeight: 600 }}>
                    Stok tidak terbatas
                  </Text>
                  <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
                    Produk digital, jasa, atau makanan
                  </Text>
                </VStack>
              </label>
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
              href="/products"
              style={{ flex: 1 }}
            />
            <Button
              label={isEdit ? "Simpan Perubahan" : "Simpan Produk"}
              type="submit"
              variant="primary"
              isLoading={loading}
              style={{ flex: 2 }}
              id="save-product-btn"
            />
          </HStack>
        </VStack>
      </form>
    </VStack>
  );
}
