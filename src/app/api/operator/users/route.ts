import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { role: "user" },
    select: {
      id: true,
      nome: true,
      email: true,
      suspended: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
