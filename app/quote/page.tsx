"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteBreakdown {
  vehicleType: string;
  baseRate: number;
  perMileRate: number;
  distanceMiles: number;
  distanceCost: number;
  subtotal: number;
  weekendSurcharge: number;
  weekendSurchargeRate: number;
  estimatedPrice: number;
}

interface QuoteData {
  estimatedPrice: number;
  distanceMiles: number;
  distanceText: string;
  duration: string;
  isWeekend: boolean;
  breakdown: QuoteBreakdown;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: string;
  date: string;
  time: string;
  passengers: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Breakdown row ────────────────────────────────────────────────────────────

function BdRow({ label, value, sub, total }: { label: string; value: string; sub?: string; total?: boolean }) {
  return (
    <div
      className="flex justify-between items-start py-4 gap-4"
      style={{ borderTop: total ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="min-w-0">
        <p className={`text-sm ${total ? "font-semibold text-white" : "text-gray-500"}`}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: "#333" }}>{sub}</p>}
      </div>
      <span className={`font-mono shrink-0 ${total ? "text-xl font-bold text-white" : "text-sm text-gray-400"}`}>
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Quote content ────────────────────────────────────────────────────────────

function QuoteContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [quoteData, setQuoteData]   = useState<QuoteData | null>(null);
  const [formData, setFormData]     = useState<FormData | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const cancelled = params.get("cancelled") === "true";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("limo_quote");
      if (raw) {
        const { form, quote } = JSON.parse(raw);
        setFormData(form);
        setQuoteData(quote);
      }
    } catch { /* URL-param fallback below */ }
  }, []);

  // URL-param fallback (page refresh)
  const vehicleParam = params.get("vehicle") ?? "SEDAN";
  const nameParam    = decodeURIComponent(params.get("name") ?? "");
  const priceParam   = params.get("price") ?? "0";

  const vehicle      = formData?.vehicleType ?? vehicleParam;
  const customerName = formData?.customerName ?? nameParam;
  const totalPrice   = quoteData?.estimatedPrice ?? Number(priceParam);

  async function handleConfirm() {
    if (!formData || !quoteData) { router.push("/"); return; }
    setConfirming(true);
    setConfirmError("");
    try {
      const res  = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, quoteData }),
      });
      const data = await res.json();
      if (!res.ok) { setConfirmError(data.error || "Could not start checkout."); return; }
      window.location.href = data.url;
    } catch {
      setConfirmError("Network error. Please try again.");
      setConfirming(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Top chrome bar */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a 20%, #777 50%, #2a2a2a 80%, transparent)" }} />

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-xs tracking-[0.15em] uppercase transition-colors"
            style={{ color: "#444" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >
            ← Edit
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
          <div>
            <p className="text-sm font-semibold">Your Quote</p>
            {customerName && (
              <p className="text-[11px]" style={{ color: "#444" }}>For {customerName}</p>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-3">

        {/* ── Price hero ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "#060606",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <p className="text-[10px] tracking-[0.35em] uppercase mb-6" style={{ color: "#3a3a3a" }}>
            Estimated Fare
          </p>
          <p className="font-black leading-none mb-4" style={{ fontSize: "clamp(3.5rem,12vw,5.5rem)", color: "#fff" }}>
            ${totalPrice.toFixed(2)}
          </p>
          {quoteData?.isWeekend && (
            <span
              className="inline-block text-[11px] tracking-[0.08em] px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888" }}
            >
              Weekend rate applied · +20%
            </span>
          )}
          {quoteData && (
            <p className="text-[11px] tracking-wide" style={{ color: "#333" }}>
              {quoteData.distanceText}&nbsp;·&nbsp;{quoteData.duration} drive
            </p>
          )}
        </div>

        {/* ── Breakdown ───────────────────────────────────────────── */}
        {quoteData?.breakdown && (
          <div className="lux-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-[0.04em]">Price Breakdown</h2>
              <span className="text-xs" style={{ color: "#444" }}>
                {VEHICLE_LABELS[vehicle]}
              </span>
            </div>
            <BdRow
              label="Base rate"
              value={`$${quoteData.breakdown.baseRate.toFixed(2)}`}
              sub="Flat fee per trip"
            />
            <BdRow
              label={`Distance — ${quoteData.breakdown.distanceMiles.toFixed(1)} mi × $${quoteData.breakdown.perMileRate.toFixed(2)}/mi`}
              value={`$${quoteData.breakdown.distanceCost.toFixed(2)}`}
              sub={`${quoteData.distanceText} via Google Maps`}
            />
            {quoteData.breakdown.weekendSurcharge > 0 && (
              <BdRow
                label={`Weekend surcharge (${(quoteData.breakdown.weekendSurchargeRate * 100).toFixed(0)}%)`}
                value={`+$${quoteData.breakdown.weekendSurcharge.toFixed(2)}`}
                sub="Fridays & Saturdays"
              />
            )}
            <BdRow
              label="Total"
              value={`$${quoteData.breakdown.estimatedPrice.toFixed(2)}`}
              total
            />
          </div>
        )}

        {/* ── Trip summary ─────────────────────────────────────────── */}
        {formData && (
          <div className="lux-card p-6 space-y-5">
            <h2 className="text-sm font-semibold tracking-[0.04em]">Trip Summary</h2>

            {/* Route */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <div className="flex-1 w-px my-2" style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.05))", minHeight: 28 }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#555" }} />
              </div>
              <div className="flex-1 space-y-5 min-w-0">
                <div>
                  <label className="lux-label">Pickup</label>
                  <p className="text-sm text-white">{formData.pickupAddress}</p>
                </div>
                <div>
                  <label className="lux-label">Drop-off</label>
                  <p className="text-sm" style={{ color: "#888" }}>{formData.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="divider-chrome" />

            {/* Meta */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="lux-label">Date</label>
                <p className="text-xs text-white leading-snug">{formatDate(formData.date)}</p>
              </div>
              <div>
                <label className="lux-label">Time</label>
                <p className="text-sm text-white">{formatTime(formData.time)}</p>
              </div>
              <div>
                <label className="lux-label">Passengers</label>
                <p className="text-sm text-white">{formData.passengers}</p>
              </div>
            </div>

            <div className="divider-chrome" />

            <div>
              <label className="lux-label">Passenger</label>
              <p className="text-sm text-white">{formData.customerName}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#444" }}>
                {formData.customerEmail}&nbsp;·&nbsp;{formData.customerPhone}
              </p>
            </div>
          </div>
        )}

        {/* ── Included ─────────────────────────────────────────────── */}
        <div className="lux-card p-6">
          <h2 className="text-sm font-semibold tracking-[0.04em] mb-4">What&apos;s Included</h2>
          <div className="space-y-3">
            {[
              "Professional uniformed chauffeur",
              "Complimentary bottled water",
              "Flight tracking for airport transfers",
              "Meet & greet service",
              "Free cancellation up to 24 hours",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                    <path d="M1 2.5l1.5 1.5L6 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "#888" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notices */}
        {cancelled && (
          <div className="rounded-xl px-4 py-3 text-sm flex gap-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ color: "#666" }}>ℹ</span>
            <span style={{ color: "#888" }}>Payment cancelled. Your quote is still saved.</span>
          </div>
        )}
        {confirmError && (
          <div className="rounded-xl px-4 py-3 text-sm flex gap-2"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <span>⚠</span>
            <span className="text-red-400">{confirmError}</span>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <button onClick={handleConfirm} disabled={confirming || !formData} className="btn-primary">
          {confirming ? (
            <><Spinner />Redirecting to secure checkout…</>
          ) : (
            <>Confirm &amp; Pay ${totalPrice.toFixed(2)}&nbsp;&nbsp;→</>
          )}
        </button>

        <p className="text-center text-[10px] tracking-[0.15em] uppercase pb-4" style={{ color: "#252525" }}>
          Secured by Stripe&nbsp;·&nbsp;256-bit SSL&nbsp;·&nbsp;No card data stored
        </p>

        {!formData && (
          <div className="rounded-xl p-4 text-sm text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ color: "#555" }}>Session expired. </span>
            <button onClick={() => router.push("/")} className="underline" style={{ color: "#888" }}>
              Start a new quote →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    }>
      <QuoteContent />
    </Suspense>
  );
}
