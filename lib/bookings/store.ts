/**
 * In-memory booking + ticket stores, keyed by LangGraph thread_id.
 *
 * Cached on globalThis so they survive Next.js dev hot-reloads and are shared
 * by every API route in the same server process. For production, replace these
 * with a real database (Postgres, Redis, ...).
 */

export type TripType = "one-way" | "round-trip";
export type CabinClass = "economy" | "business" | "first";

export interface BookingDraft {
  origin?: string;
  destination?: "MARS";
  departureDate?: string;
  returnDate?: string;
  tripType?: TripType;
  passengers?: number;
  leadPassenger?: string;
  email?: string;
  cabinClass?: CabinClass;
  fastTransit?: boolean;
  notes?: string;
  status?: "DRAFT" | "CONFIRMED";
  reference?: string;
}

export interface Ticket {
  reference: string;
  status: "CONFIRMED";
  origin: string;
  destination: "MARS";
  arrivalHub: string;
  departureDate: string;
  returnDate: string | null;
  tripType: TripType;
  launchWindow: string;
  transit: string;
  passengers: number;
  leadPassenger: string;
  email: string;
  cabinClass: CabinClass;
  spacecraft: string;
  price: Record<string, unknown>;
  issuedAt: string;
}

const g = globalThis as unknown as {
  __rsvBookings?: Map<string, BookingDraft>;
  __rsvTickets?: Map<string, Ticket>;
};

export const bookingStore: Map<string, BookingDraft> =
  g.__rsvBookings ?? (g.__rsvBookings = new Map());

export const ticketStore: Map<string, Ticket> =
  g.__rsvTickets ?? (g.__rsvTickets = new Map());
