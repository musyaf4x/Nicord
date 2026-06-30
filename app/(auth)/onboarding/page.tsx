import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Setup Usaha — Nicord" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Find the user's business
  const member = await prisma.businessMember.findFirst({
    where: { userId: session.user.id, role: "OWNER" },
    include: { business: true },
  });

  if (!member) redirect("/login");

  // Skip onboarding if already done
  if (member.business.isOnboarded) redirect("/dashboard");

  return <OnboardingWizard businessId={member.business.id} />;
}
