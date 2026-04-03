import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { sendBookingConfirmationEmail } from "@/lib/email";
import Stripe from "stripe";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const { stripe } = await import("@/lib/stripe");
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const m = session.metadata ?? {};

    const existing = db.booking.findUnique({ where: { stripeSessionId: session.id } });
    if (!existing) {
      const booking = db.booking.create({
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
          distanceMiles:   m.distanceMiles ? parseFloat(m.distanceMiles) : null,
          duration:        m.duration       ?? null,
          isWeekend:       m.isWeekend === "true",
          status:          "CONFIRMED",
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string | null,
        },
      });

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
      } catch (err) {
        console.error("[webhook] email failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
