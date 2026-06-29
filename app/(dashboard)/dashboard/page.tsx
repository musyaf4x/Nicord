import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Placeholder — Sprint 1 S4-02 will build the real dashboard
export default function DashboardPage() {
  return (
    <div style={{ padding: "var(--spacing-6)" }}>
      <h1 style={{ color: "var(--color-text-primary)" }}>
        Dashboard
      </h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Nicord — Sprint 1 foundation in progress
      </p>
    </div>
  );
}
