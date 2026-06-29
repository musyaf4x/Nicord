import type { Metadata } from "next";
import { VStack, Card, Heading, Text } from "@astryxdesign/core";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Nicord baru — gratis",
};

export default function RegisterPage() {
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
            <Text
              size="sm"
              style={{ color: "var(--color-text-secondary)", textAlign: "center" }}
            >
              Mulai gratis. Tidak perlu kartu kredit.
            </Text>
          </VStack>

          {/* Form */}
          <VStack gap={2}>
            <Heading level={2}>Buat akun baru</Heading>
            <RegisterForm />
          </VStack>
        </VStack>
      </Card>
    </VStack>
  );
}
