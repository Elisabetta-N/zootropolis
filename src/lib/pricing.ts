export const PRICING = {
  unlockFee: 1.0,
  perMinute: 0.25,
  perKm: 0.5,
};

export function getCostBreakdown(
  durationSeconds: number,
  distanceMeters?: number | null
) {
  const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
  const unlock = PRICING.unlockFee;
  const timeCost = minutes * PRICING.perMinute;
  const distCost = distanceMeters
    ? (distanceMeters / 1000) * PRICING.perKm
    : 0;
  const total = Math.round((unlock + timeCost + distCost) * 100) / 100;
  return { unlock, minutes, timeCost, distCost, total, durationSeconds };
}

export function calculateRideCost(
  durationSeconds: number,
  distanceMeters?: number | null
) {
  return getCostBreakdown(durationSeconds, distanceMeters).total;
}

export function formatEuro(amount: number) {
  return `€${amount.toFixed(2)}`;
}
