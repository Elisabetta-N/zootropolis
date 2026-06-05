import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  const { vehicleId, destination, distance } = await req.json();

  if (!vehicleId) {
    return NextResponse.json(
      { message: "vehicleId richiesto" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    return NextResponse.json({ message: "Mezzo non trovato" }, { status: 404 });
  }

  if (vehicle.status !== "available") {
    return NextResponse.json(
      { message: "Mezzo non disponibile" },
      { status: 409 }
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: "booked" },
    });

    return tx.booking.create({
      data: {
        userId: parseInt(userId),
        vehicleId,
        status: "active",
        destination: destination ?? null,
        distance: distance ?? null,
      },
      include: { vehicle: true },
    });
  });

  return NextResponse.json({
    message: "Prenotazione confermata",
    booking,
  });
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";

  const bookings = await prisma.booking.findMany({
    where: {
      userId: parseInt(userId),
      ...(all
        ? {}
        : { status: { in: ["active", "awaiting_payment"] } }),
    },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
