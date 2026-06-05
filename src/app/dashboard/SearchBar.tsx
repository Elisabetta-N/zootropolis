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
};

function vehicleLabel(type: string) {
  return type === "bike" ? "Bici" : "Monopattino";
}

function vehicleEmoji(type: string) {
  return type === "bike" ? "🚲" : "🛴";
}

export default function SearchBar({
  onDestinationSelect,
  destination,
  userPosition,
  vehicles,
  activeBooking,
  onBookVehicle,
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const nearbyVehicles = useMemo(() => {
    if (!userPosition || !destination) return [];
    return vehicles
      .map((v) => ({
        ...v,
        distance: haversineMeters(userPosition.lat, userPosition.lng, v.lat, v.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  }, [userPosition, destination, vehicles]);

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
  }

  async function handleBook(vehicleId: number) {
    setBookingId(vehicleId);
    await onBookVehicle(vehicleId);
    setBookingId(null);
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

      {destination && nearbyVehicles.length > 0 && (
        <div className="nearby-vehicles-panel">
          <h4>Mezzi disponibili vicini</h4>
          <ul className="nearby-vehicles-list">
            {nearbyVehicles.map((v) => (
              <li key={v.id} className="nearby-vehicle-item">
                <div className="nearby-vehicle-info">
                  <span
                    className="nearby-dot"
                    style={{ background: batteryDotColor(v.batteryLevel) }}
                  />
                  <div>
                    <strong>
                      {vehicleEmoji(v.type)} {vehicleLabel(v.type)} #{v.id}
                    </strong>
                    <span className="nearby-meta">
                      {formatMeters(v.distance)} · Carica {v.batteryLevel}%
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
                  disabled={!!activeBooking || bookingId === v.id}
                  onClick={() => handleBook(v.id)}
                >
                  {bookingId === v.id
                    ? "..."
                    : activeBooking
                      ? "Corsa attiva"
                      : "Prenota"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {destination && nearbyVehicles.length === 0 && (
        <div className="nearby-vehicles-panel nearby-vehicles-panel--empty">
          <p>Nessun mezzo disponibile nelle vicinanze.</p>
        </div>
      )}
    </div>
  );
}
