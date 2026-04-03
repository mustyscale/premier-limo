import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/confirmation?session_id=<id>
 *
 * Demo mode: session IDs starting with "demo_" are looked up directly in the DB.
 * Production mode: looks up by stripeSessionId; falls back to Stripe session metadata
 * if the webhook hasn't fired yet.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  // ── 1. Try the database first (works for both demo and production) ──────────
  const booking = await prisma.booking.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (booking) {
    return NextResponse.json({ source: "db", booking });
  }

  // ── 2. Demo mode: booking should always be in DB — return 404 ──────────────
  if (sessionId.startsWith("demo_")) {
    return NextResponse.json(
      { error: "Booking not found. Please try again." },
      { status: 404 }
    );
  }

  // ── 3. Production: webhook may not have fired yet — fall back to Stripe ────
  try {
    const { stripe } = await import("@/lib/stripe");
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", paymentStatus: session.payment_status },
        { status: 402 }
      );
    }

    const m = session.metadata ?? {};
    return NextResponse.json({
      source: "stripe",
      pending: true,
      session: {
        id:             session.id,
        customerName:   m.customerName,
        customerEmail:  m.customerEmail ?? session.customer_email,
        customerPhone:  m.customerPhone,
        pickupAddress:  m.pickupAddress,
        dropoffAddress: m.dropoffAddress,
        vehicleType:    m.vehicleType,
        date:           m.date,
        time:           m.time,
        passengers:     m.passengers,
        estimatedPrice: m.estimatedPrice,
        distanceMiles:  m.distanceMiles,
        duration:       m.duration,
        isWeekend:      m.isWeekend,
        amountTotal:    session.amount_total,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve session";
    console.error("[confirmation] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
