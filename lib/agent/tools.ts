import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { getVectorStore } from "../rag/store";
import { bookingStore, ticketStore, type BookingDraft } from "../bookings/store";
import { quotePrice, ORIGINS } from "./pricing";
import { checkLaunchWindows } from "./launch";

const REQUIRED_FIELDS: (keyof BookingDraft)[] = [
  "origin",
  "destination",
  "departureDate",
  "passengers",
  "leadPassenger",
  "email",
  "cabinClass",
];

function threadIdFrom(config: unknown): string {
  const c = config as { configurable?: { thread_id?: string } } | undefined;
  return c?.configurable?.thread_id ?? "default";
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

function missingFields(draft: BookingDraft): string[] {
  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (field === "destination") {
      if (draft.destination !== "MARS") missing.push("destination (must be MARS)");
      continue;
    }
    const value = draft[field];
    if (value === undefined || value === null || value === "") missing.push(field);
  }
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    missing.push("a valid email address");
  }
  return missing;
}

function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `RSV-MARS-${code}`;
}

function spacecraftFor(cabinClass: string, fastTransit: boolean): string {
  if (fastTransit) return "SpaceX Starship Ares-IX (fusion-drive)";
  if (cabinClass === "first") return "SpaceX Starship Ares-VII 'Olympus'";
  if (cabinClass === "business") return "SpaceX Starship Ares-V";
  return "Roscosmos Zarya-M nuclear transit tug";
}

/* --------------------------------- tools ---------------------------------- */

export const searchKnowledgeBase = tool(
  async ({ query }: { query: string }) => {
    const store = await getVectorStore();
    const results = await store.similaritySearch(query, 5);
    if (results.length === 0) return "No relevant information found in the knowledge base.";
    return results
      .map((doc, i) => `[${i + 1}] ${doc.metadata?.title ?? "Knowledge"}\n${doc.pageContent}`)
      .join("\n\n---\n\n");
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the Redstone Voyages knowledge base (Retrieval-Augmented Generation) for facts and policy: fleet & spacecraft, launch windows, fares & inclusions, health / medical requirements, pre-flight training, baggage allowance, Mars arrival & accommodation, booking & cancellation policy, spaceports, and safety / insurance / legal. Use this before answering any policy question.",
    schema: z.object({
      query: z.string().describe("A focused natural-language search query."),
    }),
  },
);

export const checkLaunchWindowsTool = tool(
  async ({ departureDate }: { departureDate: string }) =>
    JSON.stringify(checkLaunchWindows(departureDate), null, 2),
  {
    name: "check_launch_windows",
    description:
      "Check whether a desired Earth departure date (YYYY-MM-DD) falls inside a Mars Hohmann transfer window, or whether the premium fast-transit fusion service is needed. Returns the matching or nearest window, lead time and transit duration.",
    schema: z.object({
      departureDate: z.string().describe("Desired Earth departure date, YYYY-MM-DD."),
    }),
  },
);

export const quotePriceTool = tool(
  async (input: {
    cabinClass: "economy" | "business" | "first";
    passengers: number;
    tripType?: "one-way" | "round-trip";
    fastTransit?: boolean;
  }) => JSON.stringify(quotePrice(input), null, 2),
  {
    name: "quote_price",
    description:
      "Calculate an itemised price quote (per passenger, subtotal, spaceport taxes & fees, total) for a Mars trip. Always use this instead of estimating fares yourself.",
    schema: z.object({
      cabinClass: z.enum(["economy", "business", "first"]),
      passengers: z.number().int().min(1).max(6),
      tripType: z.enum(["one-way", "round-trip"]).default("one-way"),
      fastTransit: z.boolean().default(false),
    }),
  },
);

export const updateBookingDetails = tool(
  async (input: Record<string, unknown>, config: unknown) => {
    const id = threadIdFrom(config);
    const current = bookingStore.get(id) ?? {};
    const next: BookingDraft = { ...current, ...stripUndefined(input) };
    if (!next.status) next.status = "DRAFT";
    bookingStore.set(id, next);

    const missing = missingFields(next);
    return [
      "Saved. Current booking draft:",
      JSON.stringify(next, null, 2),
      missing.length
        ? `Still required: ${missing.join(", ")}.`
        : "All required details are present — summarise and ask the traveller to confirm.",
    ].join("\n");
  },
  {
    name: "update_booking_details",
    description:
      "Record or update one or more fields of the traveller's booking draft as soon as you learn them. Call this every time the user provides or changes a detail.",
    schema: z.object({
      origin: z.enum(ORIGINS).optional().describe("Earth departure spaceport."),
      destination: z.literal("MARS").optional(),
      departureDate: z.string().optional().describe("YYYY-MM-DD"),
      returnDate: z.string().optional().describe("YYYY-MM-DD, round-trip only"),
      tripType: z.enum(["one-way", "round-trip"]).optional(),
      passengers: z.number().int().min(1).max(6).optional(),
      leadPassenger: z.string().optional().describe("Full name of the lead traveller"),
      email: z.string().optional(),
      cabinClass: z.enum(["economy", "business", "first"]).optional(),
      fastTransit: z.boolean().optional(),
      notes: z.string().optional(),
    }),
  },
);

export const createBooking = tool(
  async (_input: { confirmed: true }, config: unknown) => {
    const id = threadIdFrom(config);
    const draft = bookingStore.get(id) ?? {};

    const missing = missingFields(draft);
    if (missing.length) {
      return `Cannot confirm yet. Missing required details: ${missing.join(
        ", ",
      )}. Ask the traveller for these first, then call create_booking again.`;
    }

    const windowInfo = checkLaunchWindows(draft.departureDate as string);
    if ("error" in windowInfo) {
      return `Cannot confirm: ${windowInfo.error} Ask the traveller for a valid departure date.`;
    }
    if (windowInfo.recommendation === "too-soon") {
      return `Cannot confirm: ${windowInfo.note}`;
    }

    const fastTransit =
      draft.fastTransit ?? windowInfo.recommendation === "fast-transit";
    const tripType = draft.tripType ?? "one-way";
    const price = quotePrice({
      cabinClass: draft.cabinClass as string,
      passengers: draft.passengers as number,
      tripType,
      fastTransit,
    });

    const reference = makeReference();
    const ticket = {
      reference,
      status: "CONFIRMED" as const,
      origin: draft.origin as string,
      destination: "MARS" as const,
      arrivalHub: "Olympus Base, Valles Marineris",
      departureDate: draft.departureDate as string,
      returnDate: tripType === "round-trip" ? draft.returnDate ?? null : null,
      tripType,
      launchWindow: windowInfo.window?.id ?? "FAST-TRANSIT",
      transit: fastTransit
        ? "~39 days (fusion fast-transit)"
        : windowInfo.window?.transit ?? "~7 months",
      passengers: draft.passengers as number,
      leadPassenger: draft.leadPassenger as string,
      email: draft.email as string,
      cabinClass: draft.cabinClass as "economy" | "business" | "first",
      spacecraft: spacecraftFor(draft.cabinClass as string, fastTransit),
      price,
      issuedAt: new Date().toISOString(),
    };

    ticketStore.set(id, ticket);
    bookingStore.set(id, { ...draft, status: "CONFIRMED", reference, fastTransit, tripType });

    return [
      "BOOKING CONFIRMED. Present this to the traveller as a boarding-pass summary,",
      `and mention that a confirmation email is on its way to ${ticket.email}.`,
      JSON.stringify(ticket, null, 2),
    ].join("\n");
  },
  {
    name: "create_booking",
    description:
      "Finalise and confirm the Mars trip. ONLY call this after every required detail is collected AND the traveller has explicitly said yes to booking. Returns the confirmed ticket with a booking reference.",
    schema: z.object({
      confirmed: z
        .literal(true)
        .describe("Set to true only when the traveller has explicitly confirmed."),
    }),
  },
);

export const getBooking = tool(
  async ({ reference }: { reference: string }) => {
    const wanted = reference.trim().toUpperCase();
    for (const ticket of ticketStore.values()) {
      if (ticket.reference === wanted) return JSON.stringify(ticket, null, 2);
    }
    return `No confirmed booking found with reference ${wanted}.`;
  },
  {
    name: "get_booking",
    description: "Look up a previously confirmed booking by its reference code (e.g. RSV-MARS-AB12CD).",
    schema: z.object({ reference: z.string() }),
  },
);

export const tools = [
  searchKnowledgeBase,
  checkLaunchWindowsTool,
  quotePriceTool,
  updateBookingDetails,
  createBooking,
  getBooking,
];
