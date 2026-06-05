import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const reports = await prisma.urbanMaintenance.findMany({
    include: {
      reportedBy: { select: { nome: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (role !== "admin" || !userId) {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const { title, description, lat, lng } = await req.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { message: "Titolo e descrizione richiesti" },
      { status: 400 }
    );
  }

  const report = await prisma.urbanMaintenance.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      lat: lat ?? null,
      lng: lng ?? null,
      reportedById: parseInt(userId),
    },
  });

  return NextResponse.json(report);
}
