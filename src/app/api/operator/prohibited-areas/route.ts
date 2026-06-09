import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const areas = await prisma.prohibitedArea.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(areas);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { name, lat, lng, radius } = body;

  const area = await prisma.prohibitedArea.create({
    data: {
      name,
      lat,
      lng,
      radius: radius || 200,
    },
  });

  return NextResponse.json(area);
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body;

  await prisma.prohibitedArea.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
