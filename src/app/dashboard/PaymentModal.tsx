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
};

export default function PaymentModal({
  breakdown,
  paymentMethod,
  onPay,
  onCancel,
  paying,
}: Props) {
  const mins = Math.floor(breakdown.durationSeconds / 60);
  const secs = breakdown.durationSeconds % 60;

  return (
    <>
      <div className="panel-backdrop" />
      <div className="payment-modal">
        <h2>💳 Pagamento corsa</h2>
        <p className="payment-sub">
          Paghi solo ciò che hai consumato
        </p>

        <div className="payment-breakdown">
          <div className="payment-row">
            <span>Sblocco mezzo</span>
            <span>{formatEuro(breakdown.unlock)}</span>
          </div>
          <div className="payment-row">
            <span>
              Tempo utilizzo ({breakdown.minutes} min · {mins}:
              {secs.toString().padStart(2, "0")})
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
