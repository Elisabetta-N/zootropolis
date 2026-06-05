import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;
  const { searchParams } = new URL(req.url);
  const threadUserId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  if (role === "operator" || role === "admin") {
    if (threadUserId) {
      const thread = await prisma.supportMessage.findMany({
        where: { userId: parseInt(threadUserId) },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(thread);
    }

    const messages = await prisma.supportMessage.findMany({
      where: { isStaff: false },
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(messages);
  }

  const messages = await prisma.supportMessage.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  const { message, vehicleId, targetUserId } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json(
      { message: "Messaggio richiesto" },
      { status: 400 }
    );
  }

  if (role === "operator" || role === "admin") {
    if (!targetUserId) {
      return NextResponse.json(
        { message: "targetUserId richiesto" },
        { status: 400 }
      );
    }

    const staffMsg = await prisma.supportMessage.create({
      data: {
        userId: parseInt(targetUserId),
        message: message.trim(),
        isStaff: true,
      },
    });

    return NextResponse.json({ staffMsg });
  }

  const userMsg = await prisma.supportMessage.create({
    data: {
      userId: parseInt(userId),
      message: message.trim(),
      vehicleId: vehicleId ?? null,
    },
  });

  if (vehicleId && message.trim().toLowerCase().includes("guasto")) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { hasFault: true, faultNote: message.trim() },
    });
  }

  return NextResponse.json({ userMsg });
}
