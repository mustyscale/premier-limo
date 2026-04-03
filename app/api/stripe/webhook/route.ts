import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";
import Stripe from "stripe";

// Next.js App Router: disable body parsing so we get raw bytes for Stripe signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // ── Verify signature ───────────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    const { stripe } = await import("@/lib/stripe");
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[webhook] signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── Handle events ──────────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
  }

  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const m = session.metadata ?? {};

  // Idempotency guard
  const existing = await prisma.booking.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) {
    console.log("[webhook] booking already exists for session", session.id);
    return;
  }

  // ── Create confirmed booking ───────────────────────────────────────────────
  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        customerName:    m.customerName   ?? "",
        customerPhone:   m.customerPhone  ?? "",
        customerEmail:   m.customerEmail  ?? (session.customer_email ?? ""),
        pickupAddress:   m.pickupAddress  ?? "",
        dropoffAddress:  m.dropoffAddress ?? "",
        vehicleType:     m.vehicleType    ?? "SEDAN",
        date:            m.date           ?? "",
        time:            m.time           ?? "",
        passengers:      parseInt(m.passengers  ?? "1", 10),
        estimatedPrice:  parseFloat(m.estimatedPrice ?? "0"),
        distanceMiles:   m.distanceMiles  ? parseFloat(m.distanceMiles)  : null,
        duration:        m.duration       ?? null,
        isWeekend:       m.isWeekend === "true",
        status:          "CONFIRMED",
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent as string | null,
      },
    });
    console.log("[webhook] booking created:", booking.id);
  } catch (err) {
    console.error("[webhook] failed to create booking:", err);
    throw err;
  }

  // ── Send confirmation email ────────────────────────────────────────────────
  try {
    await sendBookingConfirmationEmail({
      bookingId:      booking.id,
      customerName:   booking.customerName,
      customerEmail:  booking.customerEmail,
      customerPhone:  booking.customerPhone,
      pickupAddress:  booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      vehicleType:    booking.vehicleType,
      date:           booking.date,
      time:           booking.time,
      passengers:     booking.passengers,
      estimatedPrice: booking.estimatedPrice,
      distanceMiles:  booking.distanceMiles ?? undefined,
      duration:       booking.duration      ?? undefined,
      isWeekend:      booking.isWeekend,
    });
    console.log("[webhook] confirmation email sent to", booking.customerEmail);
  } catch (err) {
    console.error("[webhook] email send failed:", err);
  }
}
