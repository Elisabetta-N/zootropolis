import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const points = await prisma.incentivePoint.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(points);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { lat, lng, discount } = body;

  const point = await prisma.incentivePoint.create({
    data: {
      lat,
      lng,
      discount: discount || 10,
    },
  });

  return NextResponse.json(point);
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body;

  await prisma.incentivePoint.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
