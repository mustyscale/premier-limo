import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { getDistanceMatrix } from "@/lib/maps";
import { calculatePrice } from "@/lib/pricing";
const VALID_VEHICLES = ["SEDAN", "SUV", "SPRINTER", "LIMO"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      pickupAddress,
      dropoffAddress,
      vehicleType,
      date,
      time,
      passengers,
    } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    const missing = [
      "customerName", "customerPhone", "customerEmail",
      "pickupAddress", "dropoffAddress", "vehicleType", "date", "time", "passengers",
    ].filter((k) => !body[k]);

    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (!VALID_VEHICLES.includes(vehicleType)) {
      return NextResponse.json({ error: "Invalid vehicleType." }, { status: 400 });
    }

    const passengerCount = Number(passengers);
    if (isNaN(passengerCount) || passengerCount < 1 || passengerCount > 20) {
      return NextResponse.json(
        { error: "passengers must be a number between 1 and 20." },
        { status: 400 }
      );
    }

    // ── Live distance + price ──────────────────────────────────────────────
    const { distanceMiles, distanceText, durationText } = await getDistanceMatrix(
      pickupAddress,
      dropoffAddress
    );

    const priceBreakdown = calculatePrice(vehicleType, distanceMiles, date);

    // ── Persist booking ────────────────────────────────────────────────────
    const booking = db.booking.create({
      data: {
        customerName,
        customerPhone,
        customerEmail,
        pickupAddress,
        dropoffAddress,
        vehicleType,
        date,
        time,
        passengers: passengerCount,
        estimatedPrice: priceBreakdown.estimatedPrice,
        distanceMiles: distanceMiles ?? null,
        duration: durationText ?? null,
        isWeekend: priceBreakdown.isWeekend,
        status: "PENDING",
        stripeSessionId: null,
        stripePaymentId: null,
      },
    });

    return NextResponse.json(
      {
        booking,
        estimatedPrice:   priceBreakdown.estimatedPrice,
        distanceMiles:    priceBreakdown.distanceMiles,
        distanceText,
        duration:         durationText,
        isWeekend:        priceBreakdown.isWeekend,
        breakdown: {
          baseRate:          priceBreakdown.baseRate,
          distanceMiles:     priceBreakdown.distanceMiles,
          distanceCost:      priceBreakdown.distanceCost,
          subtotal:          priceBreakdown.subtotal,
          weekendSurcharge:  priceBreakdown.weekendSurcharge,
          estimatedPrice:    priceBreakdown.estimatedPrice,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create booking.";
    console.error("Booking error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
