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
  const { suspended } = await req.json();

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { suspended },
  });

  return NextResponse.json(user);
}
