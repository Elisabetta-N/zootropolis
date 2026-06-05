import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { nome, email, password } = await req.json();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!nome || !normalizedEmail || !password) {
    return NextResponse.json(
      { message: "Tutti i campi sono obbligatori" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Email già registrata" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      nome: nome.trim(),
      email: normalizedEmail,
      password: hashed,
      role: "user",
    },
  });

  const res = NextResponse.json({
    message: "Registrazione OK",
    redirect: "/dashboard",
  });
  res.cookies.set("userId", String(user.id), { httpOnly: true, path: "/" });
  res.cookies.set("role", "user", { httpOnly: true, path: "/" });

  return res;
}
