import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/pdf/invoice-pdf";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      business: { members: { some: { userId: session.user.id } } },
    },
    include: {
      customer: {
        select: { name: true, whatsappNumber: true, address: true },
      },
      items: {
        select: {
          productName: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
        },
      },
      business: {
        select: { name: true, whatsappNumber: true, address: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfProps = {
    order: {
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      channel: order.channel,
      grandTotal: Number(order.grandTotal),
      amountPaid: Number(order.amountPaid),
      amountDue: Number(order.amountDue),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      notes: order.notes,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
      customer: {
        name: order.customer.name,
        whatsappNumber: order.customer.whatsappNumber,
        address: order.customer.address,
      },
    },
    business: {
      name: order.business.name,
      whatsappNumber: order.business.whatsappNumber,
      address: order.business.address,
    },
  };

  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, pdfProps) as React.ReactElement<any>
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
    },
  });
}
