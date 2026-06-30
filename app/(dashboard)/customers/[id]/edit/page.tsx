import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerForm } from "../../_components/customer-form";

export const metadata: Metadata = { title: "Edit Pelanggan" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session?.user?.id ?? "" } } },
    },
  });

  if (!customer) notFound();

  return (
    <CustomerForm
      customerId={customer.id}
      defaultValues={{
        name: customer.name,
        whatsappNumber: customer.whatsappNumber ?? "",
        address: customer.address ?? "",
        notes: customer.notes ?? "",
      }}
    />
  );
}
