import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { from, to } = await req.json();

  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
    return NextResponse.json(
      { message: "Coordinate from e to richieste" },
      { status: 400 }
    );
  }

  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://router.project-osrm.org/route/v1/cycling/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);

  if (!res.ok) {
    return NextResponse.json(
      { message: "Errore calcolo percorso" },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.[0]) {
    return NextResponse.json(
      { message: "Percorso non trovato" },
      { status: 404 }
    );
  }

  const route = data.routes[0];

  return NextResponse.json({
    coordinates: route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    ),
    distance: route.distance,
    duration: route.duration,
  });
}
