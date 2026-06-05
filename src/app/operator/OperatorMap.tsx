"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { batteryDotColor } from "@/lib/geo";
import "leaflet/dist/leaflet.css";

type Vehicle = {
  id: number;
  type: string;
  lat: number;
  lng: number;
  batteryLevel: number;
  status: string;
  hasFault: boolean;
  faultNote: string | null;
};

function makeDot(L: any, color: string, label?: string) {
  return new L.DivIcon({
    html: `<div class="vehicle-dot${label ? " vehicle-dot--fault" : ""}" style="background:${color}">${label ?? ""}</div>`,
    className: "vehicle-dot-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function OperatorMap({
  vehicles,
  onMarkFault,
}: {
  vehicles: Vehicle[];
  onMarkFault: (id: number, hasFault: boolean, note?: string) => void;
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((mod) => setL(mod.default));
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  if (!position || !L) {
    return <p className="map-loading">📍 Caricamento mappa...</p>;
  }

  const center =
    vehicles.length > 0
      ? [vehicles[0].lat, vehicles[0].lng]
      : [position.lat, position.lng];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {vehicles.map((v) => {
        let color = batteryDotColor(v.batteryLevel);
        if (v.hasFault) color = "#e84118";
        else if (v.status === "booked") color = "#3498db";

        return (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={makeDot(L, color, v.hasFault ? "!" : undefined)}
          >
            <Popup>
              <div className="vehicle-popup">
                <strong>
                  {v.type === "bike" ? "🚲 Bici" : "🛴 Monopattino"} #{v.id}
                </strong>
                <p>Stato: {v.status}</p>
                <p>Carica: {v.batteryLevel}%</p>
                {v.hasFault && (
                  <p className="fault-text">
                    ⚠️ Guasto: {v.faultNote || "Segnalato"}
                  </p>
                )}
                <button
                  className="book-btn"
                  onClick={() =>
                    onMarkFault(
                      v.id,
                      !v.hasFault,
                      v.hasFault ? undefined : "Guasto segnalato"
                    )
                  }
                >
                  {v.hasFault ? "Risolvi guasto" : "Segna guasto"}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
