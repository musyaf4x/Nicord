import type { Metadata } from "next";
import { VStack, Card, Heading, Text } from "@astryxdesign/core";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Nicord Anda",
};

export default function LoginPage() {
  return (
    <VStack
      align="center"
      justify="center"
      style={{ minHeight: "100dvh", padding: "var(--spacing-4)" }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "var(--spacing-8)",
        }}
      >
        <VStack gap={6}>
          {/* Brand */}
          <VStack gap={1} align="center">
            <Heading level={1} style={{ color: "var(--color-accent-text)" }}>
              Nicord
            </Heading>
            <Text size="sm" style={{ color: "var(--color-text-secondary)", textAlign: "center" }}>
              Sistem kerja untuk UMKM social commerce
            </Text>
          </VStack>

          {/* Form */}
          <VStack gap={2}>
            <Heading level={2}>Masuk ke akun Anda</Heading>
            <LoginForm />
          </VStack>
        </VStack>
      </Card>
    </VStack>
  );
}
