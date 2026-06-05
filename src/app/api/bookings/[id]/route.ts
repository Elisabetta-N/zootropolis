import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCostBreakdown } from "@/lib/pricing";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = parseInt(id);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: parseInt(userId), status: "active" },
    include: { vehicle: true },
  });

  if (!booking) {
    return NextResponse.json(
      { message: "Prenotazione non trovata" },
      { status: 404 }
    );
  }

  const endedAt = new Date();
  const durationSeconds =
    (endedAt.getTime() - booking.createdAt.getTime()) / 1000;
  const breakdown = getCostBreakdown(durationSeconds, booking.distance);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: "available" },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "awaiting_payment",
        endedAt,
        cost: breakdown.total,
        durationSeconds,
        paid: false,
      },
      include: { vehicle: true },
    });
  });

  return NextResponse.json({
    message: "Corsa terminata, procedi al pagamento",
    booking: updated,
    breakdown,
  });
}
