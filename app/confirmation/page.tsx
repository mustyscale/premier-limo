"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface BookingDetails {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: string;
  date: string;
  time: string;
  passengers: number | string;
  estimatedPrice: number | string;
  distanceMiles?: number | string | null;
  duration?: string | null;
  isWeekend: boolean | string;
  status?: string;
}

const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", SPRINTER: "Sprinter Van", LIMO: "Limousine",
};

function formatDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function formatTime(s: string) {
  const [h, min] = s.split(":").map(Number);
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 gap-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="lux-label" style={{ marginBottom: 0 }}>{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

function ConfirmationContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const sessionId = params.get("session_id");

  const [booking,  setBooking]  = useState<BookingDetails | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [isPending, setIsPending] = useState(false);
  const [retries,  setRetries]  = useState(0);

  const fetchConfirmation = useCallback(async () => {
    if (!sessionId) { setError("No session ID found."); setLoading(false); return; }
    try {
      const res  = await fetch(`/api/confirmation?session_id=${sessionId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not load booking."); setLoading(false); return; }

      if (data.source === "db") {
        const b = data.booking;
        setBooking({
          id: b.id, customerName: b.customerName, customerEmail: b.customerEmail,
          customerPhone: b.customerPhone, pickupAddress: b.pickupAddress,
          dropoffAddress: b.dropoffAddress, vehicleType: b.vehicleType,
          date: b.date, time: b.time, passengers: b.passengers,
          estimatedPrice: b.estimatedPrice, distanceMiles: b.distanceMiles,
          duration: b.duration, isWeekend: b.isWeekend, status: b.status,
        });
        setIsPending(false);
      } else {
        const s = data.session;
        setBooking({
          customerName: s.customerName ?? "", customerEmail: s.customerEmail ?? "",
          customerPhone: s.customerPhone ?? "", pickupAddress: s.pickupAddress ?? "",
          dropoffAddress: s.dropoffAddress ?? "", vehicleType: s.vehicleType ?? "SEDAN",
          date: s.date ?? "", time: s.time ?? "", passengers: s.passengers ?? 1,
          estimatedPrice: s.amountTotal ? s.amountTotal / 100 : parseFloat(s.estimatedPrice ?? "0"),
          distanceMiles: s.distanceMiles, duration: s.duration,
          isWeekend: s.isWeekend === "true",
        });
        setIsPending(true);
      }
    } catch { setError("Network error loading booking."); }
    finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => { fetchConfirmation(); }, [fetchConfirmation]);

  useEffect(() => {
    if (!isPending || retries >= 6) return;
    const t = setTimeout(() => { setRetries(r => r + 1); fetchConfirmation(); }, 2500);
    return () => clearTimeout(t);
  }, [isPending, retries, fetchConfirmation]);

  // Loading
  if (loading) return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border border-white/20 border-t-white/80 rounded-full animate-spin" />
    </main>
  );

  // Error
  if (error) return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm" style={{ color: "#555" }}>{error}</p>
        <button onClick={() => router.push("/")} className="btn-primary">Back to home</button>
      </div>
    </main>
  );

  if (!booking) return null;

  const price   = typeof booking.estimatedPrice === "string" ? parseFloat(booking.estimatedPrice) : booking.estimatedPrice;
  const weekend = booking.isWeekend === true || booking.isWeekend === "true";

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Top chrome bar */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a 20%, #777 50%, #2a2a2a 80%, transparent)" }} />

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center gap-2">
          <span className="text-base">🚖</span>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Premier</span>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="text-center px-6 pt-16 pb-12">
        {/* Circle check */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8"
          style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}
        >
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path d="M2 11l7 7L26 2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: "#3a3a3a" }}>
          Payment Successful
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Booking Confirmed</h1>
        <div className="divider-chrome w-20 mx-auto mb-4" />
        <p className="text-sm" style={{ color: "#555" }}>
          Thank you,&nbsp;
          <span className="text-white font-medium">{booking.customerName}</span>
          . A confirmation email is on its way.
        </p>

        {isPending && (
          <div className="inline-flex items-center gap-2 mt-5 text-[11px] tracking-[0.08em] uppercase"
            style={{ color: "#444" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
            Finalizing your record…
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16 space-y-3">

        {/* ── Amount ──────────────────────────────────────────────── */}
        <div className="lux-card p-8 text-center">
          <p className="lux-label" style={{ marginBottom: 12 }}>Amount Charged</p>
          <p className="font-black text-white leading-none" style={{ fontSize: "clamp(3rem,10vw,4.5rem)" }}>
            ${price.toFixed(2)}
          </p>
          {weekend && (
            <p className="text-[11px] mt-3 tracking-wide" style={{ color: "#444" }}>
              Includes weekend surcharge (+20%)
            </p>
          )}
        </div>

        {/* ── Details ─────────────────────────────────────────────── */}
        <div className="lux-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Booking Details</h2>
            {booking.status && (
              <span className="text-[10px] tracking-[0.12em] uppercase px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}>
                {booking.status}
              </span>
            )}
          </div>
          <DetailRow label="Vehicle"     value={VEHICLE_LABELS[booking.vehicleType] ?? booking.vehicleType} />
          <DetailRow label="Date"        value={formatDate(booking.date)} />
          <DetailRow label="Time"        value={formatTime(booking.time)} />
          <DetailRow label="Passengers"  value={String(booking.passengers)} />
          <DetailRow label="Contact"     value={`${booking.customerEmail} · ${booking.customerPhone}`} />
        </div>

        {/* ── Route ───────────────────────────────────────────────── */}
        <div className="lux-card p-6 space-y-5">
          <h2 className="text-sm font-semibold">Route</h2>
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
              <div className="flex-1 w-px my-2"
                style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.05))", minHeight: 28 }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#444" }} />
            </div>
            <div className="flex-1 space-y-5 min-w-0">
              <div>
                <label className="lux-label">Pickup</label>
                <p className="text-sm text-white">{booking.pickupAddress}</p>
              </div>
              <div>
                <label className="lux-label">Drop-off</label>
                <p className="text-sm" style={{ color: "#777" }}>{booking.dropoffAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reference ───────────────────────────────────────────── */}
        {booking.id && (
          <div className="lux-card p-5 text-center">
            <p className="lux-label" style={{ marginBottom: 8 }}>Booking Reference</p>
            <p className="font-mono text-sm text-white break-all">{booking.id}</p>
          </div>
        )}

        {/* ── Next steps ──────────────────────────────────────────── */}
        <div className="lux-card p-6 space-y-3">
          <h2 className="text-sm font-semibold mb-1">What happens next?</h2>
          {[
            { icon: "✉", text: `Confirmation sent to ${booking.customerEmail}` },
            { icon: "✆", text: "Your chauffeur will call 1 hour before pickup" },
            { icon: "✈", text: "Flight tracking active for airport transfers" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-sm w-5 shrink-0 text-center" style={{ color: "#555" }}>{icon}</span>
              <span className="text-sm" style={{ color: "#777" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push("/")} className="btn-ghost">Book again</button>
          <button onClick={() => window.print()}   className="btn-primary">Save / Print</button>
        </div>

      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
