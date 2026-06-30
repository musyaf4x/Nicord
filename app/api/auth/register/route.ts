import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + business + owner membership in one transaction
    const { user, business } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const business = await tx.business.create({
        data: {
          name: `Usaha ${name}`, // default, will be updated in onboarding
          category: "",
          paymentMethods: ["cash", "transfer", "qris"],
        },
      });

      await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      return { user, business };
    });

    return NextResponse.json(
      {
        message: "Registrasi berhasil",
        userId: user.id,
        businessId: business.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan, coba lagi" },
      { status: 500 }
    );
  }
}
