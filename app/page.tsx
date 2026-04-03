"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VEHICLES = [
  { value: "SEDAN",    label: "Sedan",     capacity: "1 – 3 passengers",  icon: "🚗", base: "$75",  mile: "$3.50/mi" },
  { value: "SUV",      label: "SUV",       capacity: "1 – 6 passengers",  icon: "🚙", base: "$95",  mile: "$4.00/mi" },
  { value: "SPRINTER", label: "Sprinter",  capacity: "1 – 14 passengers", icon: "🚐", base: "$150", mile: "$5.00/mi" },
  { value: "LIMO",     label: "Limousine", capacity: "1 – 10 passengers", icon: "🚖", base: "$200", mile: "$6.00/mi" },
];

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupAddress: "",
    dropoffAddress: "",
    vehicleType: "SEDAN",
    date: "",
    time: "",
    passengers: 1,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType:    form.vehicleType,
          pickupAddress:  form.pickupAddress,
          dropoffAddress: form.dropoffAddress,
          date:           form.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not calculate a quote."); return; }
      sessionStorage.setItem("limo_quote", JSON.stringify({ form, quote: data }));
      router.push(`/quote?vehicle=${form.vehicleType}&name=${encodeURIComponent(form.customerName)}&price=${data.estimatedPrice}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ── Top chrome bar ──────────────────────────────────────────── */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a 20%, #777 50%, #2a2a2a 80%, transparent)" }} />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🚖</span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white">Premier</span>
          </div>
          <a href="/admin" className="text-[10px] tracking-[0.15em] uppercase" style={{ color: "#3a3a3a" }}>
            Admin
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="text-center px-6 pt-20 pb-16">
        <p className="text-[10px] tracking-[0.4em] uppercase mb-6" style={{ color: "#3a3a3a" }}>
          Premium Chauffeur Service
        </p>
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-8">
          Where would you<br />like to go?
        </h1>
        <div className="divider-chrome w-20 mx-auto mb-8" />
        <p className="text-xs tracking-[0.15em]" style={{ color: "#444" }}>
          Instant pricing&nbsp;&nbsp;·&nbsp;&nbsp;Professional chauffeurs&nbsp;&nbsp;·&nbsp;&nbsp;No hidden fees
        </p>
      </div>

      {/* ── Form ────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* 01 — Contact */}
          <section className="lux-card p-7">
            <CardHeader step="01" title="Contact" />
            <div className="divider-chrome mb-6" />
            <div className="space-y-4">
              <Field label="Full Name">
                <input type="text" name="customerName" value={form.customerName}
                  onChange={handleChange} required placeholder="John Doe" className="lux-input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input type="tel" name="customerPhone" value={form.customerPhone}
                    onChange={handleChange} required placeholder="+1 (555) 000-0000" className="lux-input" />
                </Field>
                <Field label="Email">
                  <input type="email" name="customerEmail" value={form.customerEmail}
                    onChange={handleChange} required placeholder="john@example.com" className="lux-input" />
                </Field>
              </div>
            </div>
          </section>

          {/* 02 — Trip */}
          <section className="lux-card p-7">
            <CardHeader step="02" title="Trip Details" />
            <div className="divider-chrome mb-6" />
            <div className="space-y-4">
              <Field label="Pickup Address">
                <input type="text" name="pickupAddress" value={form.pickupAddress}
                  onChange={handleChange} required placeholder="123 Main St, New York, NY" className="lux-input" />
              </Field>
              <Field label="Drop-off Address">
                <input type="text" name="dropoffAddress" value={form.dropoffAddress}
                  onChange={handleChange} required placeholder="JFK Airport, Queens, NY" className="lux-input" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Date">
                  <input type="date" name="date" value={form.date}
                    onChange={handleChange} min={today} required className="lux-input" />
                </Field>
                <Field label="Time">
                  <input type="time" name="time" value={form.time}
                    onChange={handleChange} required className="lux-input" />
                </Field>
                <Field label="Passengers">
                  <input type="number" name="passengers" value={form.passengers}
                    onChange={handleChange} min={1} max={20} required className="lux-input" />
                </Field>
              </div>
            </div>
          </section>

          {/* 03 — Vehicle */}
          <section className="lux-card p-7">
            <CardHeader step="03" title="Select Vehicle" />
            <div className="divider-chrome mb-6" />
            <div className="grid grid-cols-2 gap-2">
              {VEHICLES.map((v) => {
                const sel = form.vehicleType === v.value;
                return (
                  <label key={v.value} className="cursor-pointer">
                    <input type="radio" name="vehicleType" value={v.value}
                      checked={sel} onChange={handleChange} className="sr-only" />
                    <div
                      className="rounded-xl p-5 transition-all duration-200 relative select-none"
                      style={sel
                        ? { background: "#fff", border: "1px solid #fff", boxShadow: "0 4px 20px rgba(255,255,255,0.06)" }
                        : { background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)" }
                      }
                    >
                      {/* Checkmark */}
                      {sel && (
                        <span className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5l2 2L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <span className="text-2xl block mb-3">{v.icon}</span>
                      <p className={`font-semibold text-sm tracking-wide mb-1 ${sel ? "text-black" : "text-white"}`}>
                        {v.label}
                      </p>
                      <p className={`text-[11px] mb-3 ${sel ? "text-gray-500" : "text-gray-600"}`}>
                        {v.capacity}
                      </p>
                      <div style={{ height: 1, background: sel ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)" }} className="mb-3" />
                      <p className={`text-[11px] font-mono ${sel ? "text-gray-600" : "text-gray-700"}`}>
                        {v.base}&nbsp;·&nbsp;{v.mile}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-center text-[10px] mt-4 tracking-[0.12em] uppercase" style={{ color: "#333" }}>
              +20% weekend surcharge applies on Fri &amp; Sat
            </p>
          </section>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm flex gap-2" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <span>⚠</span>
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Spinner />
                Calculating route &amp; price…
              </>
            ) : (
              "Get my instant quote →"
            )}
          </button>

          <p className="text-center text-[10px] tracking-[0.12em] uppercase pb-4" style={{ color: "#2a2a2a" }}>
            No payment now&nbsp;&nbsp;·&nbsp;&nbsp;Free cancellation up to 24 hours
          </p>
        </form>
      </div>
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CardHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-sm font-semibold tracking-[0.04em]">{title}</h2>
      <span className="text-xs tracking-[0.25em] tabular-nums" style={{ color: "#252525" }}>{step}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="lux-label">{label}</label>
      {children}
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
