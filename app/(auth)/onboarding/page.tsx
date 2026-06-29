import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Onboarding" };

// Temporary redirect — real onboarding (S1-03) will be implemented next sprint
export default function OnboardingPage() {
  redirect("/dashboard");
}
