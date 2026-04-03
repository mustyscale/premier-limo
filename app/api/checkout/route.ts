import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FormData = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: string;
  date: string;
  time: string;
  passengers: number;
};

type QuoteData = {
  estimatedPrice: number;
  distanceMiles: number;
  distanceText: string;
  duration: string;
  isWeekend: boolean;
};

// Demo mode when no real Stripe key is configured
function isDemoMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key === "" || key.startsWith("sk_test_placeholder") || key === "your-stripe-secret-key";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData, quoteData } = body as { formData: FormData; quoteData: QuoteData };

    if (!formData || !quoteData) {
      return NextResponse.json({ error: "formData and quoteData are required." }, { status: 400 });
    }

    // ── Demo mode: create booking directly, no Stripe ─────────────────────────
    if (isDemoMode()) {
      const demoSessionId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const booking = await prisma.booking.create({
        data: {
          customerName:   formData.customerName,
          customerPhone:  formData.customerPhone,
          customerEmail:  formData.customerEmail,
          pickupAddress:  formData.pickupAddress,
          dropoffAddress: formData.dropoffAddress,
          vehicleType:    formData.vehicleType,
          date:           formData.date,
          time:           formData.time,
          passengers:     Number(formData.passengers),
          estimatedPrice: quoteData.estimatedPrice,
          distanceMiles:  quoteData.distanceMiles,
          duration:       quoteData.duration,
          isWeekend:      quoteData.isWeekend,
          status:         "CONFIRMED",
          stripeSessionId: demoSessionId,
        },
      });

      console.log(`[checkout] DEMO MODE — booking created: ${booking.id}`);

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (req.headers.get("origin") || "http://localhost:3000");

      return NextResponse.json({
        url: `${appUrl}/confirmation?session_id=${demoSessionId}`,
        sessionId: demoSessionId,
        demo: true,
      });
    }

    // ── Production mode: create real Stripe Checkout Session ─────────────────
    const { stripe, toCents, VEHICLE_DISPLAY } = await import("@/lib/stripe");

    const meta = (value: string | number | boolean, maxLen = 490): string =>
      String(value).slice(0, maxLen);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (req.headers.get("origin") || "http://localhost:3000");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: toCents(quoteData.estimatedPrice),
            product_data: {
              name: `${VEHICLE_DISPLAY[formData.vehicleType] ?? formData.vehicleType} — Limo Service`,
              description: [
                `${formData.date} at ${formData.time}`,
                `${formData.pickupAddress} → ${formData.dropoffAddress}`,
                `${quoteData.distanceText} · ${quoteData.duration}`,
                formData.passengers > 1 ? `${formData.passengers} passengers` : "1 passenger",
              ].join(" · "),
              images: [],
            },
          },
        },
      ],
      customer_email: formData.customerEmail,
      metadata: {
        customerName:   meta(formData.customerName),
        customerPhone:  meta(formData.customerPhone),
        customerEmail:  meta(formData.customerEmail),
        pickupAddress:  meta(formData.pickupAddress),
        dropoffAddress: meta(formData.dropoffAddress),
        vehicleType:    meta(formData.vehicleType),
        date:           meta(formData.date),
        time:           meta(formData.time),
        passengers:     meta(formData.passengers),
        estimatedPrice: meta(quoteData.estimatedPrice),
        distanceMiles:  meta(quoteData.distanceMiles),
        duration:       meta(quoteData.duration),
        isWeekend:      meta(quoteData.isWeekend),
      },
      success_url: `${appUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/quote?cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session.";
    console.error("[checkout] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
