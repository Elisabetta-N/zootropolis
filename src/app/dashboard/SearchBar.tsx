"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { haversineMeters, formatMeters, batteryDotColor } from "@/lib/geo";
import type { Booking, Pos, Vehicle } from "./types";

export type Destination = {
  label: string;
  lat: number;
  lng: number;
};

type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

type Props = {
  onDestinationSelect: (dest: Destination | null) => void;
  destination: Destination | null;
  userPosition: Pos | null;
  vehicles: Vehicle[];
  activeBooking: Booking | null;
  onBookVehicle: (vehicleId: number) => Promise<boolean>;
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
  routeDistanceMeters?: number | null;
};

// km di autonomia massima per tipo di mezzo a batteria piena
const MAX_RANGE_KM: Record<string, number> = {
  bike: 60,
  scooter: 45,
};

function rangeKm(type: string, batteryLevel: number): number {
  return (MAX_RANGE_KM[type] ?? 45) * (batteryLevel / 100);
}

function vehicleLabel(type: string) {
  return type === "bike" ? "Bici" : "Monopattino";
}

function vehicleEmoji(type: string) {
  return type === "bike" ? "🚲" : "🛴";
}

type SortMode = "distance" | "battery";

export default function SearchBar({
  onDestinationSelect,
  destination,
  userPosition,
  vehicles,
  activeBooking,
  selectedVehicle,
  onSelectVehicle,
  routeDistanceMeters,
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("distance");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // distanza percorso in km (dalla mappa → prop)
  const routeKm = routeDistanceMeters ? routeDistanceMeters / 1000 : null;

  const nearbyVehicles = useMemo(() => {
    if (!userPosition || !destination) return [];

    return vehicles
      .map((v) => ({
        ...v,
        distance: haversineMeters(userPosition.lat, userPosition.lng, v.lat, v.lng),
        autonomiaKm: rangeKm(v.type, v.batteryLevel),
      }))
      // Nascondi monopattini se il percorso supera la loro autonomia massima
      .filter((v) => {
        if (v.type !== "bike" && routeKm !== null) {
          const maxScooterRange = MAX_RANGE_KM["scooter"]; // autonomia a 100%
          if (routeKm > maxScooterRange) return false;
        }
        // Nascondi qualsiasi mezzo la cui autonomia residua non basta per il percorso
        if (routeKm !== null && v.autonomiaKm < routeKm) return false;
        return true;
      })
      .sort((a, b) =>
        sortMode === "battery"
          ? b.batteryLevel - a.batteryLevel   // più carico prima
          : a.distance - b.distance           // più vicino prima
      )
      .slice(0, 6);
  }, [userPosition, destination, vehicles, sortMode, routeKm]);

  // quanti mezzi sono stati nascosti per autonomia insufficiente
  const hiddenCount = useMemo(() => {
    if (!userPosition || !destination || routeKm === null) return 0;
    return vehicles
      .map((v) => ({
        ...v,
        autonomiaKm: rangeKm(v.type, v.batteryLevel),
      }))
      .filter((v) => {
        if (v.type !== "bike" && routeKm > MAX_RANGE_KM["scooter"]) return true;
        if (v.autonomiaKm < routeKm) return true;
        return false;
      }).length;
  }, [userPosition, destination, vehicles, routeKm]);

  useEffect(() => {
    if (destination) {
      setQuery(destination.label);
    }
  }, [destination]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    onDestinationSelect(null);
    onSelectVehicle(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(value.trim())}`
        );
        if (res.ok) {
          const data: GeocodeResult[] = await res.json();
          setSuggestions(data);
          setOpen(data.length > 0);
        }
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function selectSuggestion(item: GeocodeResult) {
    setQuery(item.label);
    setSuggestions([]);
    setOpen(false);
    onDestinationSelect(item);
  }

  function clearSearch() {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onDestinationSelect(null);
    onSelectVehicle(null);
  }

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Dove vuoi andare?"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {loading && <span className="search-spinner">⏳</span>}
        {query && !loading && (
          <button type="button" className="search-clear" onClick={clearSearch}>
            ✕
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="search-suggestions">
          {suggestions.map((item, i) => (
            <li key={i}>
              <button type="button" onClick={() => selectSuggestion(item)}>
                📍 {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {destination && (nearbyVehicles.length > 0 || hiddenCount > 0) && (
        <div className="nearby-vehicles-panel">
          {/* Header con filtro ordinamento */}
          <div className="nearby-vehicles-header">
            <h4>Mezzi disponibili</h4>
            <div className="sort-toggle">
              <button
                type="button"
                className={`sort-btn ${sortMode === "distance" ? "sort-btn--active" : ""}`}
                onClick={() => setSortMode("distance")}
              >
                📍 Distanza
              </button>
              <button
                type="button"
                className={`sort-btn ${sortMode === "battery" ? "sort-btn--active" : ""}`}
                onClick={() => setSortMode("battery")}
              >
                ⚡ Autonomia
              </button>
            </div>
          </div>

          {/* Avviso mezzi esclusi */}
          {hiddenCount > 0 && (
            <div className="range-warning">
              ⚠️ {hiddenCount} mezzo/i nascosto/i: autonomia insufficiente per {routeKm?.toFixed(1)} km
            </div>
          )}

          {nearbyVehicles.length === 0 ? (
            <p className="nearby-empty-msg">Nessun mezzo raggiunge la destinazione con la carica attuale.</p>
          ) : (
            <ul className="nearby-vehicles-list">
              {nearbyVehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                const walkingMins = Math.round((v as typeof v & { distance: number }).distance / 1.4 / 60);
                const walkingEtaText = walkingMins <= 1 ? "1 min" : `${walkingMins} min`;
                const vWithExtra = v as typeof v & { distance: number; autonomiaKm: number };
                const autonomia = vWithExtra.autonomiaKm;
                const margine = routeKm ? autonomia - routeKm : null;

                return (
                  <li
                    key={v.id}
                    className={`nearby-vehicle-item ${isSelected ? "nearby-vehicle-item--selected" : ""}`}
                    onClick={() => onSelectVehicle(v)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="nearby-vehicle-info">
                      <span
                        className="nearby-dot"
                        style={{ background: batteryDotColor(v.batteryLevel) }}
                      />
                      <div>
                        <strong>
                          {vehicleEmoji(v.type)} {vehicleLabel(v.type)} #{v.id}
                        </strong>
                        <div className="nearby-meta-row">
                          <span className="nearby-meta">🔋 {v.batteryLevel}%</span>
                          <span className="nearby-meta nearby-range">
                            🛣️ {autonomia.toFixed(0)} km rimasti
                          </span>
                        </div>
                        {margine !== null && (
                          <span
                            className="nearby-margin"
                            style={{ color: margine > 5 ? "#4cd137" : "#ff9800" }}
                          >
                            {margine > 0
                              ? `+${margine.toFixed(1)} km di margine`
                              : "⚠️ Autonomia al limite"}
                          </span>
                        )}
                        <br />
                        <span className="walk-eta-badge">
                          🚶 {walkingEtaText} ({formatMeters(vWithExtra.distance)})
                        </span>
                      </div>
                    </div>
                    <div className="nearby-battery-bar">
                      <div
                        className="battery-fill"
                        style={{
                          width: `${v.batteryLevel}%`,
                          background: batteryDotColor(v.batteryLevel),
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="nearby-book-btn"
                      disabled={!!activeBooking}
                      style={{
                        background: isSelected ? "#4cd137" : "#ff9800",
                        color: isSelected ? "white" : "black",
                      }}
                    >
                      {isSelected ? "Selezionato" : "Seleziona"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {destination && nearbyVehicles.length === 0 && hiddenCount === 0 && (
        <div className="nearby-vehicles-panel nearby-vehicles-panel--empty">
          <p>Nessun mezzo disponibile nelle vicinanze.</p>
        </div>
      )}
    </div>
  );
}
