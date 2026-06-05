import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "admin") {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }

  const completed = await prisma.booking.findMany({
    where: { status: "completed", destination: { not: null } },
    select: { destination: true, cost: true, distance: true },
  });

  const destCount: Record<string, number> = {};
  let totalRevenue = 0;
  let totalDistance = 0;

  for (const b of completed) {
    const dest = b.destination!.split(",")[0];
    destCount[dest] = (destCount[dest] ?? 0) + 1;
    totalRevenue += b.cost ?? 0;
    totalDistance += b.distance ?? 0;
  }

  const topRoutes = Object.entries(destCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([destination, count]) => ({ destination, count }));

  const fleet = await prisma.vehicle.groupBy({
    by: ["status"],
    _count: true,
  });

  const faults = await prisma.vehicle.count({ where: { hasFault: true } });

  const totalRides = await prisma.booking.count({
    where: { status: "completed" },
  });

  const totalUsers = await prisma.user.count({ where: { role: "user" } });

  return NextResponse.json({
    topRoutes,
    totalRevenue,
    totalDistance,
    totalRides,
    totalUsers,
    fleet,
    faults,
  });
}
