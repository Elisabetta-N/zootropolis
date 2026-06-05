import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    where: {
      id: bookingId,
      userId: parseInt(userId),
      status: "awaiting_payment",
    },
  });

  if (!booking) {
    return NextResponse.json(
      { message: "Pagamento non disponibile" },
      { status: 404 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "completed", paid: true },
    include: { vehicle: true },
  });

  return NextResponse.json({
    message: "Pagamento completato",
    booking: updated,
    cost: booking.cost,
  });
}
