import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  // ── 1. Look up in the store (works for both demo and production) ───────────
  const booking = db.booking.findUnique({ where: { stripeSessionId: sessionId } });

  if (booking) {
    return NextResponse.json({ source: "db", booking });
  }

  // ── 2. Demo session not found ─────────────────────────────────────────────
  if (sessionId.startsWith("demo_")) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // ── 3. Production: fall back to Stripe session metadata ───────────────────
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
