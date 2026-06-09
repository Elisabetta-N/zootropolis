import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const reports = await prisma.urbanMaintenance.findMany({
    where: { status: "open" },
    include: {
      reportedBy: {
        select: { id: true, nome: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;

  const updated = await prisma.urbanMaintenance.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
