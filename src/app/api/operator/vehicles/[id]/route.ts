import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "operator" && role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const { hasFault, faultNote, status, blocked, stolen } = await req.json();

  const vehicle = await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: {
      ...(typeof hasFault === "boolean" && { hasFault }),
      ...(typeof faultNote === "string" && { faultNote }),
      ...(typeof status === "string" && { status }),
      ...(typeof blocked === "boolean" && { blocked }),
      ...(typeof stolen === "boolean" && { stolen, stolenAt: stolen ? new Date() : null }),
    },
  });

  return NextResponse.json(vehicle);
}
