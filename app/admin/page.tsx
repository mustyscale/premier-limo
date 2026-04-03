"use client";

import { useState, useEffect, useCallback } from "react";

type VehicleType   = "SEDAN" | "SUV" | "SPRINTER" | "LIMO";
type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: VehicleType;
  date: string;
  time: string;
  passengers: number;
  estimatedPrice: number;
  status: BookingStatus;
  createdAt: string;
}

const VEHICLE_ICONS: Record<VehicleType, string> = {
  SEDAN: "🚗", SUV: "🚙", SPRINTER: "🚐", LIMO: "🚖",
};

const STATUS_DOT: Record<BookingStatus, string> = {
  PENDING:   "#888",
  CONFIRMED: "#60a5fa",
  COMPLETED: "#4ade80",
  CANCELLED: "#f87171",
};

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { onLogin(); } else { setError("Incorrect password."); }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Top chrome bar */}
        <div className="mb-12" style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a 20%, #777 50%, #2a2a2a 80%, transparent)" }} />

        <div className="text-center mb-10">
          <span className="text-3xl block mb-6">🚖</span>
          <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: "#333" }}>Premier</p>
          <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="lux-card p-6 space-y-4">
            <div>
              <label className="lux-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="lux-input"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Verifying…" : "Enter Dashboard →"}
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState<BookingStatus | "ALL">("ALL");
  const [search,        setSearch]        = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/bookings");
    if (res.ok) { const d = await res.json(); setBookings(d.bookings); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(id: string, status: BookingStatus) {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBookings(p => p.map(b => b.id === id ? { ...b, status } : b));
  }

  async function deleteBooking(id: string) {
    if (!confirm("Delete this booking?")) return;
    await fetch(`/api/admin/bookings?id=${id}`, { method: "DELETE" });
    setBookings(p => p.filter(b => b.id !== id));
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  const filtered = bookings.filter(b => {
    const okStatus = filterStatus === "ALL" || b.status === filterStatus;
    const q = search.toLowerCase();
    const okSearch = !q || b.customerName.toLowerCase().includes(q) || b.customerEmail.toLowerCase().includes(q) || b.customerPhone.includes(q);
    return okStatus && okSearch;
  });

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === "PENDING").length,
    confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
    revenue:   bookings.filter(b => b.status !== "CANCELLED").reduce((s, b) => s + b.estimatedPrice, 0),
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Top chrome bar */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a 20%, #777 50%, #2a2a2a 80%, transparent)" }} />

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span>🚖</span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Premier</span>
            <span className="text-[10px] tracking-[0.15em] uppercase ml-3" style={{ color: "#333" }}>Admin</span>
          </div>
          <button onClick={handleLogout} className="text-[11px] tracking-[0.12em] uppercase transition-colors"
            style={{ color: "#333" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#888")}
            onMouseLeave={e => (e.currentTarget.style.color = "#333")}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total",     value: stats.total,                   color: "#fff" },
            { label: "Pending",   value: stats.pending,                 color: "#888" },
            { label: "Confirmed", value: stats.confirmed,               color: "#60a5fa" },
            { label: "Revenue",   value: `$${stats.revenue.toFixed(0)}`, color: "#fff" },
          ].map(s => (
            <div key={s.label} className="lux-card p-5">
              <p className="lux-label">{s.label}</p>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="lux-input flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="text-[10px] tracking-[0.12em] uppercase px-3 py-2 rounded-lg transition-all"
                style={filterStatus === s
                  ? { background: "#fff", color: "#000", fontWeight: 700 }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#555" }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings */}
        {loading ? (
          <div className="text-center py-20" style={{ color: "#333" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#333" }}>No bookings found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(b => (
              <div key={b.id} className="lux-card p-5 transition-all hover:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4">

                  {/* Left */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{VEHICLE_ICONS[b.vehicleType]}</span>
                      <span className="font-semibold text-sm">{b.customerName}</span>
                      {/* Status badge */}
                      <span className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[b.status] }} />
                        <span style={{ color: STATUS_DOT[b.status] }}>{b.status}</span>
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "#555" }}>
                      {b.customerEmail}&nbsp;·&nbsp;{b.customerPhone}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#444" }}>
                      {b.pickupAddress}&nbsp;→&nbsp;{b.dropoffAddress}
                    </p>
                    <p className="text-[11px]" style={{ color: "#333" }}>
                      {b.date}&nbsp;at&nbsp;{b.time}&nbsp;·&nbsp;{b.passengers} pax&nbsp;·&nbsp;{b.vehicleType}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-3">
                    <p className="text-xl font-bold text-white">${b.estimatedPrice.toFixed(2)}</p>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {b.status === "PENDING" && (
                        <ActionBtn onClick={() => updateStatus(b.id, "CONFIRMED")} label="Confirm" accent />
                      )}
                      {b.status === "CONFIRMED" && (
                        <ActionBtn onClick={() => updateStatus(b.id, "COMPLETED")} label="Complete" accent />
                      )}
                      {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                        <ActionBtn onClick={() => updateStatus(b.id, "CANCELLED")} label="Cancel" />
                      )}
                      <ActionBtn onClick={() => deleteBooking(b.id)} label="Delete" danger />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ActionBtn({ onClick, label, accent, danger }: { onClick: () => void; label: string; accent?: boolean; danger?: boolean }) {
  const base: React.CSSProperties = {
    fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600, transition: "all 0.15s",
    background: accent ? "#fff" : danger ? "transparent" : "transparent",
    color: accent ? "#000" : danger ? "#f87171" : "#666",
    border: accent ? "1px solid #fff" : danger ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(255,255,255,0.07)",
  };
  return <button style={base} onClick={onClick}>{label}</button>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/bookings").then(r => setAuthenticated(r.ok)).catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  );

  return authenticated
    ? <Dashboard />
    : <LoginForm onLogin={() => setAuthenticated(true)} />;
}
