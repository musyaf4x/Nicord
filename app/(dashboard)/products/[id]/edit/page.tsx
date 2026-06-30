import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../_components/product-form";

export const metadata: Metadata = { title: "Edit Produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session?.user?.id ?? "" } } },
    },
  });

  if (!product) notFound();

  return (
    <ProductForm
      productId={product.id}
      defaultValues={{
        name: product.name,
        description: product.description ?? "",
        sellingPrice: String(product.sellingPrice),
        costPrice: product.costPrice ? String(product.costPrice) : "",
        stock: String(product.stock),
        unit: product.unit,
        isUnlimited: product.isUnlimited,
      }}
    />
  );
}
