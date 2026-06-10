import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dipartimento di Informatica - Università di Bari (Via Orabona 4)
const DEPT_LAT = 41.1087;
const DEPT_LNG = 16.8784;

function seedVehicles() {
  return Array.from({ length: 12 }).map((_, i) => ({
    type: i % 2 === 0 ? "bike" : "scooter",
    lat: DEPT_LAT + (Math.random() - 0.5) * 0.01,
    lng: DEPT_LNG + (Math.random() - 0.5) * 0.01,
    batteryLevel: Math.floor(Math.random() * 80) + 20,
    status: "available",
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { message: "Parametri lat e lng richiesti" },
      { status: 400 }
    );
  }

  const count = await prisma.vehicle.count();

  if (count === 0) {
    await prisma.vehicle.createMany({ data: seedVehicles() });
  } else {
    // Re-seed vehicles near the department if they are too far away
    const sample = await prisma.vehicle.findFirst();
    if (sample && Math.abs(sample.lat - DEPT_LAT) > 0.05) {
      // Delete bookings linked to old vehicles first, then re-seed
      await prisma.booking.deleteMany();
      await prisma.vehicle.deleteMany();
      await prisma.vehicle.createMany({ data: seedVehicles() });
    }
  }

  // If no available vehicles, reset their status and re-seed if needed
  let available = await prisma.vehicle.findMany({
    where: { status: "available", hasFault: false },
  });

  if (available.length === 0) {
    // Reset all vehicles to available
    await prisma.vehicle.updateMany({
      data: { status: "available", hasFault: false },
    });
    available = await prisma.vehicle.findMany({
      where: { status: "available", hasFault: false },
    });
  }

  return NextResponse.json(available);
}
