/**
 * In-memory booking store — zero config, works everywhere.
 *
 * Data lives in a module-level Map.
 * - Local dev  : persists for the lifetime of the Node.js process
 * - Cloudflare : persists within a V8 isolate (survives warm requests)
 *
 * When you're ready for a real database, swap the import in each API route
 * from "@/lib/store" → "@/lib/prisma" and nothing else changes.
 */

export type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: string;
  date: string;
  time: string;
  passengers: number;
  estimatedPrice: number;
  distanceMiles: number | null;
  duration: string | null;
  isWeekend: boolean;
  status: string;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  createdAt: string; // ISO string
};

// ── Module-level store ────────────────────────────────────────────────────────

const _store = new Map<string, Booking>();

function uid(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ── Prisma-compatible API surface ─────────────────────────────────────────────

type CreateInput = Omit<Booking, "id" | "createdAt">;
type WhereUnique = { id?: string; stripeSessionId?: string };
type OrderBy = { createdAt?: "asc" | "desc" };

export const db = {
  booking: {
    create({ data }: { data: CreateInput }): Booking {
      const booking: Booking = { ...data, id: uid(), createdAt: new Date().toISOString() };
      _store.set(booking.id, booking);
      return booking;
    },

    findUnique({ where }: { where: WhereUnique }): Booking | null {
      if (where.id) return _store.get(where.id) ?? null;
      if (where.stripeSessionId !== undefined) {
        const found = Array.from(_store.values()).find(
          (b) => b.stripeSessionId === where.stripeSessionId
        );
        return found ?? null;
      }
      return null;
    },

    findMany({ orderBy }: { orderBy?: OrderBy } = {}): Booking[] {
      const all = Array.from(_store.values());
      if (orderBy?.createdAt === "desc")
        all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (orderBy?.createdAt === "asc")
        all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return all;
    },

    update({ where, data }: { where: { id: string }; data: Partial<Booking> }): Booking {
      const existing = _store.get(where.id);
      if (!existing) throw new Error(`Booking not found: ${where.id}`);
      const updated = { ...existing, ...data };
      _store.set(where.id, updated);
      return updated;
    },

    delete({ where }: { where: { id: string } }): Booking {
      const existing = _store.get(where.id);
      if (!existing) throw new Error(`Booking not found: ${where.id}`);
      _store.delete(where.id);
      return existing;
    },
  },
};
