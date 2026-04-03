// ─── Rates ────────────────────────────────────────────────────────────────────

export const BASE_RATES: Record<string, number> = {
  SEDAN: 75,
  SUV: 95,
  SPRINTER: 150,
  LIMO: 200,
};

export const PER_MILE_RATES: Record<string, number> = {
  SEDAN: 3.5,
  SUV: 4.0,
  SPRINTER: 5.0,
  LIMO: 6.0,
};

export const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  SPRINTER: "Sprinter Van",
  LIMO: "Limousine",
};

export const WEEKEND_SURCHARGE_RATE = 0.2; // 20 %

// ─── Weekend check ────────────────────────────────────────────────────────────

/** Returns true if the ISO date string (YYYY-MM-DD) falls on a Friday or Saturday */
export function isWeekendDate(date: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day); // local time — avoids UTC-shift gotcha
  return d.getDay() === 5 || d.getDay() === 6; // 5 = Friday, 6 = Saturday
}

// ─── Price calculator ─────────────────────────────────────────────────────────

export interface PriceBreakdown {
  baseRate: number;
  distanceMiles: number;
  distanceCost: number;
  subtotal: number;
  weekendSurcharge: number;
  isWeekend: boolean;
  estimatedPrice: number;
}

export function calculatePrice(
  vehicleType: string,
  distanceMiles: number,
  date: string
): PriceBreakdown {
  const baseRate = BASE_RATES[vehicleType] ?? 75;
  const perMileRate = PER_MILE_RATES[vehicleType] ?? 3.5;

  const distanceCost = round2(distanceMiles * perMileRate);
  const subtotal = round2(baseRate + distanceCost);

  const weekend = isWeekendDate(date);
  const weekendSurcharge = weekend ? round2(subtotal * WEEKEND_SURCHARGE_RATE) : 0;
  const estimatedPrice = round2(subtotal + weekendSurcharge);

  return {
    baseRate,
    distanceMiles: round2(distanceMiles),
    distanceCost,
    subtotal,
    weekendSurcharge,
    isWeekend: weekend,
    estimatedPrice,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
