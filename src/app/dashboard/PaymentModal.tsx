"use client";

import { formatEuro } from "@/lib/pricing";

type Breakdown = {
  unlock: number;
  minutes: number;
  timeCost: number;
  distCost: number;
  total: number;
  durationSeconds: number;
};

type Props = {
  breakdown: Breakdown;
  paymentMethod: string;
  onPay: () => void;
  onCancel: () => void;
  paying: boolean;
  startPos: string;
  destination: string;
  durationSeconds: number;
  vehicleType: string;
  vehicleId: number;
};

export default function PaymentModal({
  breakdown,
  paymentMethod,
  onPay,
  onCancel,
  paying,
  startPos,
  destination,
  durationSeconds,
  vehicleType,
  vehicleId,
}: Props) {
  const mins = Math.floor(durationSeconds / 60);
  const secs = Math.round(durationSeconds % 60);
  const durationText = mins > 0 ? `${mins} min ${secs} s` : `${secs} s`;

  return (
    <>
      <div className="panel-backdrop" />
      <div className="payment-modal" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <h2>💳 Pagamento corsa</h2>
        <p className="payment-sub">
          Riepilogo dell'utilizzo e pagamento
        </p>

        {/* Ride Summary */}
        <div className="payment-summary-card" style={{ marginBottom: "16px", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", textAlign: "left", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <span style={{ color: "#888", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mezzo</span>
            <strong>{vehicleType === "bike" ? "🚲 E-Bike" : "🛴 E-Scooter"} #{vehicleId}</strong>
          </div>
          <div>
            <span style={{ color: "#888", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Durata corsa</span>
            <strong>{durationText}</strong>
          </div>
          <div>
            <span style={{ color: "#888", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Partenza</span>
            <strong>📍 {startPos}</strong>
          </div>
          <div>
            <span style={{ color: "#888", display: "block", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Destinazione</span>
            <strong>🎯 {destination}</strong>
          </div>
        </div>

        <div className="payment-breakdown">
          <div className="payment-row">
            <span>Sblocco mezzo</span>
            <span>{formatEuro(breakdown.unlock)}</span>
          </div>
          <div className="payment-row">
            <span>
              Tempo utilizzo ({breakdown.minutes} min)
            </span>
            <span>{formatEuro(breakdown.timeCost)}</span>
          </div>
          {breakdown.distCost > 0 && (
            <div className="payment-row">
              <span>Distanza percorsa</span>
              <span>{formatEuro(breakdown.distCost)}</span>
            </div>
          )}
          <div className="payment-row payment-row--total">
            <span>Totale da pagare</span>
            <span>{formatEuro(breakdown.total)}</span>
          </div>
        </div>

        <div className="payment-method-info">
          <span>💳</span>
          <span>{paymentMethod}</span>
        </div>

        <button
          type="button"
          className="panel-btn"
          onClick={onPay}
          disabled={paying}
        >
          {paying ? "Pagamento in corso..." : `Paga ${formatEuro(breakdown.total)}`}
        </button>
        <button
          type="button"
          className="panel-btn panel-btn--outline"
          onClick={onCancel}
          disabled={paying}
        >
          Annulla
        </button>
      </div>
    </>
  );
}
