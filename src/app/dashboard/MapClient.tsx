"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Destination } from "./SearchBar";
import type { Booking, Pos, Vehicle } from "./types";
import { batteryDotColor } from "@/lib/geo";
import { calculateRideCost, formatEuro } from "@/lib/pricing";

type RouteInfo = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    import("leaflet").then(({ default: L }) => {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
    });
  }, [map, points]);

  return null;
}

function formatDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

function makeDotIcon(L: any, color: string) {
  return new L.DivIcon({
    html: `<div class="vehicle-dot" style="background:${color}"></div>`,
    className: "vehicle-dot-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

type Props = {
  destination: Destination | null;
  activeBooking: Booking | null;
  onBookingChange: (booking: Booking | null) => void;
  position: Pos | null;
  vehicles: Vehicle[];
  onBookVehicle: (vehicleId: number) => Promise<boolean>;
  onRouteChange: (distance: number | null) => void;
  onVehiclesReload: () => void;
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
};

export default function MapClient({
  destination,
  activeBooking,
  onBookingChange,
  position,
  vehicles,
  onRouteChange,
  selectedVehicle,
  onSelectVehicle,
}: Props) {
  const [leafletReady, setLeafletReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    import("leaflet").then((mod) => {
      const Leaflet = mod.default;
      delete (Leaflet.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(Leaflet);
      setLeafletReady(true);
    });
  }, []);

  const loadActiveBooking = useCallback(async () => {
    const res = await fetch("/api/bookings");
    if (res.ok) {
      const bookings: Booking[] = await res.json();
      onBookingChange(bookings[0] ?? null);
    }
  }, [onBookingChange]);

  useEffect(() => {
    loadActiveBooking();
  }, [loadActiveBooking]);

  useEffect(() => {
    if (!position || !destination) {
      setRoute(null);
      onRouteChange(null);
      return;
    }

    const fromPos = selectedVehicle
      ? { lat: selectedVehicle.lat, lng: selectedVehicle.lng }
      : position;

    setRouteLoading(true);
    fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromPos, to: destination }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setRoute(data);
        onRouteChange(data?.distance ?? null);
      })
      .finally(() => setRouteLoading(false));
  }, [position, destination, selectedVehicle, onRouteChange]);

  if (!position || !leafletReady || !L) {
    return <p className="map-loading">📍 Localizzazione in corso...</p>;
  }

  const destIcon = new L.DivIcon({
    html: "🎯",
    className: "vehicle-icon",
    iconSize: [30, 30],
  });

  const boundsPoints: [number, number][] = destination
    ? [
        selectedVehicle
          ? [selectedVehicle.lat, selectedVehicle.lng]
          : [position.lat, position.lng],
        [destination.lat, destination.lng],
      ]
    : [];

  const estimatedTripCost =
    route && !activeBooking
      ? calculateRideCost(route.duration, route.distance)
      : null;

  // Estimate driving duration at ~30 km/h (8.33 m/s)
  const drivingSeconds = route ? Math.round(route.distance / 8.33) : 0;

  return (
    <>
      {route && (
        <div className="route-panel" style={{ bottom: "24px", left: "16px" }}>
          <h3>🗺️ Percorso</h3>
          <p>
            <strong>Distanza:</strong> {formatDistance(route.distance)}
          </p>
          <p>
            <strong>Tempo stimato in auto:</strong> {formatDuration(drivingSeconds)}
          </p>
          {selectedVehicle && (
            <p style={{ fontSize: "12px", color: "#666" }}>
              Partenza da: {selectedVehicle.type === "bike" ? "🚲 E-Bike" : "🛴 E-Scooter"} #{selectedVehicle.id}
            </p>
          )}
          {estimatedTripCost != null && (
            <p className="route-cost">
              <strong>Costo stimato:</strong> {formatEuro(estimatedTripCost)}
            </p>
          )}
          {destination && (
            <p className="route-dest">
              <strong>Destinazione:</strong> {destination.label.split(",")[0]}
            </p>
          )}
        </div>
      )}

      {routeLoading && (
        <div className="route-panel route-panel--loading">
          Calcolo percorso...
        </div>
      )}

      <MapContainer
        center={[position.lat, position.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {route && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{ color: "#ff9800", weight: 5, opacity: 0.85 }}
          />
        )}

        {boundsPoints.length === 2 && <FitBounds points={boundsPoints} />}

        <Marker position={[position.lat, position.lng]}>
          <Popup>📍 Sei qui</Popup>
        </Marker>

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destIcon}
          >
            <Popup>🎯 {destination.label}</Popup>
          </Marker>
        )}

        {vehicles.map((v) => {
          const dotColor = batteryDotColor(v.batteryLevel);
          const isSelected = selectedVehicle?.id === v.id;
          return (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={makeDotIcon(L, isSelected ? "#ff9800" : dotColor)}
              eventHandlers={{
                click: () => {
                  onSelectVehicle(v);
                },
              }}
            >
              <Popup>
                <div className="vehicle-popup">
                  <strong>
                    {v.type === "bike" ? "🚲 E-Bike" : "🛴 E-Scooter"} #{v.id}
                  </strong>

                  <div className="battery-section">
                    <span>Carica: {v.batteryLevel}%</span>
                    <div className="battery-bar">
                      <div
                        className="battery-fill"
                        style={{
                          width: `${v.batteryLevel}%`,
                          background: dotColor,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    className="book-btn"
                    onClick={() => onSelectVehicle(v)}
                    style={{ background: isSelected ? "#4cd137" : "#ff9800", color: isSelected ? "white" : "black" }}
                  >
                    {isSelected ? "Selezionato" : "Dettagli"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
