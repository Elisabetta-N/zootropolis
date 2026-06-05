import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { message: "Parametro q richiesto" },
      { status: 400 }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "it");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Zootropolis/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: "Errore geocoding" },
      { status: 502 }
    );
  }

  const data = await res.json();

  const results = data.map(
    (item: { display_name: string; lat: string; lon: string }) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    })
  );

  return NextResponse.json(results);
}
