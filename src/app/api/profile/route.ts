import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("userId")?.value;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      nome: true,
      email: true,
      citta: true,
      avatar: true,
      documentStatus: true,
      paymentMethod: true,
      paymentBrand: true,
      createdAt: true,
      notifications: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Utente non trovato" }, { status: 404 });
  }

  const activeBooking = await prisma.booking.findFirst({
    where: { userId: parseInt(userId), status: "active" },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  const totalRides = await prisma.booking.count({
    where: { userId: parseInt(userId), status: "completed" },
  });

  return NextResponse.json({ user, activeBooking, totalRides });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  const { notifications, avatar, citta, paymentMethod, nome, documentStatus } =
    await req.json();

  const user = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      ...(typeof notifications === "boolean" && { notifications }),
      ...(typeof avatar === "string" && { avatar }),
      ...(typeof citta === "string" && citta.trim() && { citta: citta.trim() }),
      ...(typeof nome === "string" && nome.trim() && { nome: nome.trim() }),
      ...(typeof paymentMethod === "string" &&
        paymentMethod.trim() && { paymentMethod: paymentMethod.trim() }),
      ...(typeof documentStatus === "string" && { documentStatus }),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      citta: true,
      avatar: true,
      documentStatus: true,
      paymentMethod: true,
      paymentBrand: true,
      notifications: true,
    },
  });

  return NextResponse.json(user);
}
