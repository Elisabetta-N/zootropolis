"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapInner() {
  return (
    <div className="h-full w-full">
      <MapContainer
        center={[45.4642, 9.19]}
        zoom={13}
        className="h-screen w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[45.4642, 9.19]}>
          <Popup>🚲 Bicicletta disponibile</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}