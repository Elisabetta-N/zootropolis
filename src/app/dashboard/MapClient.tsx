"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Pos = {
  lat: number;
  lng: number;
};

type Vehicle = {
  id: number;
  type: "bike" | "scooter";
  lat: number;
  lng: number;
};

export default function MapClient() {
  const [position, setPosition] = useState<Pos | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [leafletReady, setLeafletReady] = useState(false);
  const [L, setL] = useState<any>(null); // lo stato per Leaflet

  // 🔧 Carica Leaflet solo lato client
  useEffect(() => {
    import("leaflet").then((mod) => {
      const Leaflet = mod.default;

      // Fix icone
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      setL(Leaflet); // adesso Leaflet è pronto
      setLeafletReady(true);
    });
  }, []);

  // 📍 GEOLOCATION
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setPosition({ lat, lng });

      const fakeVehicles: Vehicle[] = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        type: i % 2 === 0 ? "bike" : "scooter",
        lat: lat + (Math.random() - 0.5) * 0.01,
        lng: lng + (Math.random() - 0.5) * 0.01,
      }));

      setVehicles(fakeVehicles);
    });
  }, []);

  if (!position || !leafletReady || !L) {
    return <p style={{ color: "white" }}>📍 Localizzazione in corso...</p>;
  }

  // Marker icons
  const bikeIcon = new L.DivIcon({
    html: "🚲",
    className: "vehicle-icon",
    iconSize: [30, 30],
  });

  const scooterIcon = new L.DivIcon({
    html: "🛴",
    className: "vehicle-icon",
    iconSize: [30, 30],
  });

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* USER */}
      <Marker position={[position.lat, position.lng]}>
        <Popup>📍 Sei qui</Popup>
      </Marker>

      {/* MEZZI */}
      {vehicles.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={v.type === "bike" ? bikeIcon : scooterIcon}
        >
          <Popup>
            {v.type === "bike" ? "🚲 Bici" : "🛴 Monopattino"}
            <br />
            <button>Prenota</button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}