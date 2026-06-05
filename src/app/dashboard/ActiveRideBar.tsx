"use client";

import { useEffect, useState } from "react";
import type { Booking } from "./types";
import { calculateRideCost, formatEuro, PRICING } from "@/lib/pricing";

type Props = {
  booking: Booking;
  onEndRide: () => void;
  ending: boolean;
};

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ActiveRideBar({ booking, onEndRide, ending }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    function tick() {
      const secs = Math.floor(
        (Date.now() - new Date(booking.createdAt).getTime()) / 1000
      );
      setElapsed(secs);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking.createdAt]);

  const estimatedCost = calculateRideCost(elapsed, booking.distance);

  return (
    <div className="active-ride-bar">
      <div className="active-ride-info">
        <span className="active-ride-badge">🟢 Corsa attiva</span>
        <span>
          {booking.vehicle.type === "bike" ? "🚲 Bici" : "🛴 Monopattino"} #
          {booking.vehicleId}
        </span>
        <span className="active-ride-timer">{formatElapsed(elapsed)}</span>
        <span className="active-ride-cost">
          Costo: <strong>{formatEuro(estimatedCost)}</strong>
        </span>
      </div>
      <div className="active-ride-pricing">
        <small>
          {formatEuro(PRICING.unlockFee)} sblocco + {formatEuro(PRICING.perMinute)}/min
          {booking.distance
            ? ` + ${formatEuro(PRICING.perKm)}/km`
            : ""}
        </small>
      </div>
      <button
        type="button"
        className="end-ride-btn"
        onClick={onEndRide}
        disabled={ending}
      >
        {ending ? "Chiusura..." : "Termina corsa"}
      </button>
    </div>
  );
}
