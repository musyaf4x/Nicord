"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { VStack, Button, TextInput, Text } from "@astryxdesign/core";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setServerError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Email atau password salah");
      } else {
        router.push("/dashboard");
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

        {serverError && (
          <Text size="sm" role="alert" style={{ color: "var(--color-critical-text)" }}>
            {serverError}
          </Text>
        )}

        <Button
          label="Masuk"
          type="submit"
          variant="primary"
          isLoading={loading}
          style={{ width: "100%" }}
          id="login-submit-btn"
        />

        <Text
          size="sm"
          style={{ textAlign: "center", color: "var(--color-text-secondary)" }}
        >
          Belum punya akun?{" "}
          <Link
            href="/register"
            style={{ color: "var(--color-accent-text)", fontWeight: 500 }}
          >
            Daftar sekarang
          </Link>
        </Text>
      </VStack>
    </form>
  );
}
