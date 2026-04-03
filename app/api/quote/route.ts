import { NextRequest, NextResponse } from "next/server";
import { getDistanceMatrix } from "@/lib/maps";
import { calculatePrice, BASE_RATES, PER_MILE_RATES, WEEKEND_SURCHARGE_RATE } from "@/lib/pricing";

const VALID_VEHICLES = ["SEDAN", "SUV", "SPRINTER", "LIMO"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleType, pickupAddress, dropoffAddress, date } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!vehicleType || !pickupAddress || !dropoffAddress || !date) {
      return NextResponse.json(
        { error: "vehicleType, pickupAddress, dropoffAddress, and date are required." },
        { status: 400 }
      );
    }

    if (!VALID_VEHICLES.includes(vehicleType)) {
      return NextResponse.json(
        { error: `Invalid vehicleType. Must be one of: ${VALID_VEHICLES.join(", ")}.` },
        { status: 400 }
      );
    }

    // ── Distance Matrix ────────────────────────────────────────────────────
    const { distanceMiles, distanceText, durationText } = await getDistanceMatrix(
      pickupAddress,
      dropoffAddress
    );

    // ── Price calculation ──────────────────────────────────────────────────
    const breakdown = calculatePrice(vehicleType, distanceMiles, date);

    // ── Response ───────────────────────────────────────────────────────────
    return NextResponse.json({
      estimatedPrice: breakdown.estimatedPrice,
      distanceMiles: breakdown.distanceMiles,
      distanceText,
      duration: durationText,
      isWeekend: breakdown.isWeekend,
      breakdown: {
        vehicleType,
        baseRate:          breakdown.baseRate,
        perMileRate:       PER_MILE_RATES[vehicleType],
        distanceMiles:     breakdown.distanceMiles,
        distanceCost:      breakdown.distanceCost,
        subtotal:          breakdown.subtotal,
        weekendSurcharge:  breakdown.weekendSurcharge,
        weekendSurchargeRate: breakdown.isWeekend ? WEEKEND_SURCHARGE_RATE : 0,
        estimatedPrice:    breakdown.estimatedPrice,
      },
      rates: {
        base: BASE_RATES[vehicleType],
        perMile: PER_MILE_RATES[vehicleType],
        weekendSurcharge: `${(WEEKEND_SURCHARGE_RATE * 100).toFixed(0)}%`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to calculate quote.";
    const isAddressError =
      message.includes("address") ||
      message.includes("route") ||
      message.includes("NOT_FOUND") ||
      message.includes("ZERO_RESULTS");

    return NextResponse.json(
      { error: message },
      { status: isAddressError ? 422 : 500 }
    );
  }
}
