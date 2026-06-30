"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  VStack,
  HStack,
  Card,
  Heading,
  Text,
  Button,
  TextInput,
} from "@astryxdesign/core";

// ─── Schema ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(2, "Nama usaha minimal 2 karakter"),
  category: z.string().min(1, "Pilih kategori usaha"),
});

const step2Schema = z.object({
  whatsappNumber: z
    .string()
    .regex(/^62\d{8,13}$/, "Format: 628xxxxxxxxx")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
});

const step3Schema = z.object({
  paymentMethods: z.array(z.string()).min(1, "Pilih minimal 1 metode bayar"),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Fashion & Pakaian",
  "Makanan & Minuman",
  "Kosmetik & Kecantikan",
  "Elektronik & Aksesoris",
  "Kerajinan & Handmade",
  "Tanaman & Bunga",
  "Kesehatan & Wellness",
  "Lainnya",
];

const PAYMENT_METHODS = [
  "Transfer Bank",
  "QRIS",
  "GoPay",
  "OVO",
  "Dana",
  "BCA",
  "Mandiri",
  "BRI",
  "Shopee Pay",
  "COD",
];

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <HStack gap={2} align="center" justify="center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background:
              i === current
                ? "var(--color-accent-text)"
                : i < current
                ? "var(--color-accent-border)"
                : "var(--color-border-default)",
            transition: "all 0.2s ease",
          }}
        />
      ))}
    </HStack>
  );
}

// ─── Step 1: Nama & Kategori Usaha ────────────────────────────────────────────

function Step1Form({ onNext }: { onNext: (data: Step1) => void }) {
  const { control, handleSubmit } = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: "", category: "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <VStack gap={5}>
        <VStack gap={1}>
          <Heading level={2}>Nama Usaha Kamu</Heading>
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
            Nama ini akan muncul di invoice dan nota pembayaran.
          </Text>
        </VStack>

        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Nama usaha"
              placeholder="Contoh: Toko Baju Aini"
              value={field.value}
              onChange={(v) => field.onChange(v)}
              status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
              isRequired
            />
          )}
        />

        <Controller
          name="category"
          control={control}
          render={({ field, fieldState }) => (
            <VStack gap={2}>
              <Text size="sm" style={{ fontWeight: 600 }}>
                Kategori Usaha <span style={{ color: "var(--color-critical-text)" }}>*</span>
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 8,
                }}
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    id={`cat-${cat.replace(/\s/g, "-").toLowerCase()}`}
                    onClick={() => field.onChange(cat)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `2px solid ${field.value === cat ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
                      background: field.value === cat ? "var(--color-accent-wash)" : "transparent",
                      color: field.value === cat ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      fontSize: 13,
                      fontWeight: field.value === cat ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {fieldState.error && (
                <Text size="sm" style={{ color: "var(--color-critical-text)" }}>
                  {fieldState.error.message}
                </Text>
              )}
            </VStack>
          )}
        />

        <Button label="Lanjut →" type="submit" variant="primary" style={{ width: "100%" }} />
      </VStack>
    </form>
  );
}

// ─── Step 2: Kontak & Lokasi ──────────────────────────────────────────────────

function Step2Form({
  onNext,
  onBack,
}: {
  onNext: (data: Step2) => void;
  onBack: () => void;
}) {
  const { control, handleSubmit } = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { whatsappNumber: "", address: "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <VStack gap={5}>
        <VStack gap={1}>
          <Heading level={2}>Kontak & Lokasi</Heading>
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
            Digunakan untuk invoice WhatsApp dan pengiriman. Bisa diisi nanti.
          </Text>
        </VStack>

        <Controller
          name="whatsappNumber"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Nomor WhatsApp"
              placeholder="628xxxxxxxxx"
              type="text"
              htmlName="whatsapp"
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
              isOptional
            />
          )}
        />

        <Controller
          name="address"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Alamat Usaha"
              placeholder="Jl. Merdeka No. 1, Jakarta"
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              status={fieldState.error ? { type: "error", message: fieldState.error.message } : undefined}
              isOptional
            />
          )}
        />

        <HStack gap={3}>
          <Button label="← Kembali" variant="ghost" onClick={onBack} style={{ flex: 1 }} />
          <Button label="Lanjut →" type="submit" variant="primary" style={{ flex: 2 }} />
        </HStack>
      </VStack>
    </form>
  );
}

// ─── Step 3: Metode Pembayaran ────────────────────────────────────────────────

function Step3Form({
  onNext,
  onBack,
  loading,
}: {
  onNext: (data: Step3) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const { control, handleSubmit } = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { paymentMethods: [] },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <VStack gap={5}>
        <VStack gap={1}>
          <Heading level={2}>Metode Pembayaran</Heading>
          <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
            Pilih metode yang kamu terima. Muncul di invoice otomatis.
          </Text>
        </VStack>

        <Controller
          name="paymentMethods"
          control={control}
          render={({ field, fieldState }) => (
            <VStack gap={2}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 8,
                }}
              >
                {PAYMENT_METHODS.map((method) => {
                  const selected = field.value.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      id={`pay-${method.replace(/\s/g, "-").toLowerCase()}`}
                      onClick={() => {
                        const next = selected
                          ? field.value.filter((m) => m !== method)
                          : [...field.value, method];
                        field.onChange(next);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `2px solid ${selected ? "var(--color-accent-border)" : "var(--color-border-default)"}`,
                        background: selected ? "var(--color-accent-wash)" : "transparent",
                        color: selected ? "var(--color-accent-text)" : "var(--color-text-primary)",
                        fontSize: 13,
                        fontWeight: selected ? 600 : 400,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {selected ? "✓ " : ""}{method}
                    </button>
                  );
                })}
              </div>
              {fieldState.error && (
                <Text size="sm" style={{ color: "var(--color-critical-text)" }}>
                  {fieldState.error.message}
                </Text>
              )}
            </VStack>
          )}
        />

        <HStack gap={3}>
          <Button label="← Kembali" variant="ghost" onClick={onBack} style={{ flex: 1 }} />
          <Button
            label={loading ? "Menyimpan..." : "Selesai →"}
            type="submit"
            variant="primary"
            isLoading={loading}
            style={{ flex: 2 }}
          />
        </HStack>
      </VStack>
    </form>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

export function OnboardingWizard({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Step1 & Step2 & Step3>>({});

  async function handleStep1(data: Step1) {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(1);
  }

  async function handleStep2(data: Step2) {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  }

  async function handleStep3(data: Step3) {
    setLoading(true);
    setError(null);
    const payload = { ...formData, ...data, isOnboarded: true };
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Gagal menyimpan. Coba lagi.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const TOTAL_STEPS = 3;

  return (
    <VStack
      align="center"
      justify="center"
      style={{ minHeight: "100dvh", padding: "var(--spacing-4)" }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "var(--spacing-8)",
        }}
      >
        <VStack gap={6}>
          {/* Header */}
          <VStack gap={3} align="center">
            <Heading level={1} style={{ color: "var(--color-accent-text)" }}>
              Nicord
            </Heading>
            <StepIndicator current={step} total={TOTAL_STEPS} />
            <Text size="sm" style={{ color: "var(--color-text-secondary)" }}>
              Langkah {step + 1} dari {TOTAL_STEPS}
            </Text>
          </VStack>

          {error && (
            <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
              {error}
            </Text>
          )}

          {step === 0 && <Step1Form onNext={handleStep1} />}
          {step === 1 && (
            <Step2Form onNext={handleStep2} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <Step3Form
              onNext={handleStep3}
              onBack={() => setStep(1)}
              loading={loading}
            />
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
