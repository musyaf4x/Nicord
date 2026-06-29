"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { VStack, Button, TextInput, Text } from "@astryxdesign/core";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        setServerError(body.error || "Pendaftaran gagal");
        return;
      }

      // Auto-login after register
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    } catch {
      setServerError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <VStack gap={4}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Nama lengkap"
              type="text"
              placeholder="Contoh: Budi Santoso"
              htmlName="name"
              value={field.value}
              onChange={(val) => field.onChange(val)}
              status={
                fieldState.error
                  ? { type: "error", message: fieldState.error.message }
                  : undefined
              }
              isRequired
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Email"
              type="email"
              placeholder="nama@email.com"
              htmlName="email"
              value={field.value}
              onChange={(val) => field.onChange(val)}
              status={
                fieldState.error
                  ? { type: "error", message: fieldState.error.message }
                  : undefined
              }
              isRequired
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Password"
              type="password"
              placeholder="Min. 8 karakter"
              htmlName="password"
              value={field.value}
              onChange={(val) => field.onChange(val)}
              status={
                fieldState.error
                  ? { type: "error", message: fieldState.error.message }
                  : undefined
              }
              isRequired
            />
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Konfirmasi password"
              type="password"
              placeholder="Ulangi password"
              htmlName="confirm-password"
              value={field.value}
              onChange={(val) => field.onChange(val)}
              status={
                fieldState.error
                  ? { type: "error", message: fieldState.error.message }
                  : undefined
              }
              isRequired
            />
          )}
        />

        {serverError && (
          <Text
            size="sm"
            role="alert"
            style={{ color: "var(--color-critical-text)" }}
          >
            {serverError}
          </Text>
        )}

        <Button
          label="Buat akun"
          type="submit"
          variant="primary"
          isLoading={loading}
          style={{ width: "100%" }}
          id="register-submit-btn"
        />

        <Text
          size="sm"
          style={{ textAlign: "center", color: "var(--color-text-secondary)" }}
        >
          Sudah punya akun?{" "}
          <Link
            href="/login"
            style={{ color: "var(--color-accent-text)", fontWeight: 500 }}
          >
            Masuk
          </Link>
        </Text>
      </VStack>
    </form>
  );
}
