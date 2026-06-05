import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function seedVehicles(lat: number, lng: number) {
  return Array.from({ length: 12 }).map((_, i) => ({
    type: i % 2 === 0 ? "bike" : "scooter",
    lat: lat + (Math.random() - 0.5) * 0.01,
    lng: lng + (Math.random() - 0.5) * 0.01,
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

  let count = await prisma.vehicle.count();

  if (count === 0) {
    await prisma.vehicle.createMany({ data: seedVehicles(lat, lng) });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { status: "available", hasFault: false },
  });

  return NextResponse.json(vehicles);
}
