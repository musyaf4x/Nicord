import type { Metadata } from "next";
import { AppShell } from "@astryxdesign/core";
import { DashboardNav } from "./_components/dashboard-nav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AppShell
      sideNav={<DashboardNav />}
      height="fill"
      variant="elevated"
      contentPadding={4}
    >
      {children}
    </AppShell>
  );
}
