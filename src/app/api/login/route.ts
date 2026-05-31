import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Utente non trovato" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(
    password,
    user.password
  );

  if (!valid) {
    return NextResponse.json(
      { message: "Password errata" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    message: "Login OK",
  });

  res.cookies.set("userId", String(user.id), {
    httpOnly: true,
    path: "/",
  });

  return res;
}