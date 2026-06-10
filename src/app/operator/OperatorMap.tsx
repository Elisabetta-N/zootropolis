"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
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
  blocked: boolean;
  stolen: boolean;
};

function makeDot(L: any, color: string, label?: string) {
  return new L.DivIcon({
    html: `<div class="vehicle-dot${label ? " vehicle-dot--fault" : ""}" style="background:${color}">${label ?? ""}</div>`,
    className: "vehicle-dot-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MapClickHandler({
  isSettingIncentive,
  onSetIncentivePoint,
}: {
  isSettingIncentive: boolean;
  onSetIncentivePoint?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isSettingIncentive && onSetIncentivePoint) {
        onSetIncentivePoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function OperatorMap({
  vehicles,
  onMarkFault,
  onBlockVehicle,
  onSetIncentivePoint,
  onReportStolen,
}: {
  vehicles: Vehicle[];
  onMarkFault: (id: number, hasFault: boolean, note?: string) => void;
  onBlockVehicle?: (id: number, blocked: boolean) => void;
  onSetIncentivePoint?: (lat: number, lng: number) => void;
  onReportStolen?: (id: number, stolen: boolean) => void;
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  const [incentivePoint, setIncentivePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [isSettingIncentive, setIsSettingIncentive] = useState(false);

  useEffect(() => {
    import("leaflet").then((mod) => setL(mod.default));
    // Hard-coded: Dipartimento di Informatica — Università di Bari (Via Orabona 4)
    setPosition({ lat: 41.1087, lng: 16.8784 });
  }, []);

  if (!position || !L) {
    return <p className="map-loading">📍 Caricamento mappa...</p>;
  }

  const handleSetIncentivePoint = (lat: number, lng: number) => {
    setIncentivePoint({ lat, lng });
    if (onSetIncentivePoint) {
      onSetIncentivePoint(lat, lng);
    }
    setIsSettingIncentive(false);
  };

  const center =
    vehicles.length > 0
      ? [vehicles[0].lat, vehicles[0].lng]
      : [position.lat, position.lng];

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {onSetIncentivePoint && (
        <div className="incentive-controls">
          <button
            type="button"
            className={`incentive-btn ${isSettingIncentive ? "incentive-btn--active" : ""}`}
            onClick={() => setIsSettingIncentive(!isSettingIncentive)}
          >
            {isSettingIncentive ? "🎯 Clicca sulla mappa" : "📍 Imposta punto incentivo"}
          </button>
          {incentivePoint && (
            <button
              type="button"
              className="incentive-btn incentive-btn--clear"
              onClick={() => setIncentivePoint(null)}
            >
              ✖ Cancella
            </button>
          )}
        </div>
      )}
      <MapContainer
        center={center as [number, number]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <MapClickHandler
          isSettingIncentive={isSettingIncentive}
          onSetIncentivePoint={handleSetIncentivePoint}
        />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {vehicles.map((v) => {
          let color = batteryDotColor(v.batteryLevel);
          if (v.stolen) color = "#c0392b";
          else if (v.blocked) color = "#9b59b6";
          else if (v.hasFault) color = "#e84118";
          else if (v.status === "booked") color = "#3498db";

          return (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={makeDot(L, color, v.stolen ? "🚨" : v.blocked ? "🔒" : v.hasFault ? "!" : undefined)}
            >
              <Popup>
                <div className="vehicle-popup">
                  <strong>
                    {v.type === "bike" ? "🚲 Bici" : "🛴 Monopattino"} #{v.id}
                  </strong>
                  <p>Stato: {v.status}</p>
                  <p>Carica: {v.batteryLevel}%</p>
                  {v.stolen && (
                    <p className="fault-text" style={{ color: "#c0392b" }}>
                      🚨 Veicolo segnalato come RUBATO
                    </p>
                  )}
                  {v.blocked && !v.stolen && (
                    <p className="fault-text" style={{ color: "#9b59b6" }}>
                      🔒 Veicolo bloccato
                    </p>
                  )}
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
                  {onBlockVehicle && (
                    <button
                      className="book-btn"
                      style={{ marginTop: "8px", background: v.blocked ? "#4cd137" : "#9b59b6" }}
                      onClick={() => onBlockVehicle(v.id, !v.blocked)}
                    >
                      {v.blocked ? "Sblocca veicolo" : "Blocca veicolo"}
                    </button>
                  )}
                  {onReportStolen && (
                    <button
                      className="book-btn"
                      style={{ marginTop: "8px", background: v.stolen ? "#4cd137" : "#c0392b", color: "white" }}
                      onClick={() => onReportStolen(v.id, !v.stolen)}
                    >
                      {v.stolen ? "✅ Ritrovato" : "🚨 Segna rubato"}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {incentivePoint && (
          <Marker
            position={[incentivePoint.lat, incentivePoint.lng]}
            icon={makeDot(L, "#ff9800", "🎯")}
          >
            <Popup>
              <div className="vehicle-popup">
                <strong>🎯 Punto Incentivo</strong>
                <p>Parcheggio incentivato</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
