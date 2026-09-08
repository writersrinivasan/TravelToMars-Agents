export const ORIGINS = [
  "Boca Chica",
  "Baikonur",
  "Kourou",
  "Sriharikota",
] as const;

export const CABIN_CLASSES = ["economy", "business", "first"] as const;

const BASE_FARE_USD: Record<string, number> = {
  economy: 2_500_000,
  business: 6_000_000,
  first: 12_000_000,
};

const CABIN_LABEL: Record<string, string> = {
  economy: "Economy — shared cryo-cabin",
  business: "Business — private transit pod",
  first: "First — Olympus Suite",
};

export interface QuoteInput {
  cabinClass: string;
  passengers: number;
  tripType?: "one-way" | "round-trip";
  fastTransit?: boolean;
}

export function quotePrice({
  cabinClass,
  passengers,
  tripType = "one-way",
  fastTransit = false,
}: QuoteInput) {
  const base = BASE_FARE_USD[cabinClass] ?? BASE_FARE_USD.economy;
  const tripMultiplier = tripType === "round-trip" ? 1.8 : 1;
  const fastMultiplier = fastTransit ? 1.4 : 1;

  const perPassenger = Math.round(base * tripMultiplier * fastMultiplier);
  const subtotal = perPassenger * passengers;
  const taxesAndFees = Math.round(subtotal * 0.08); // spaceport + regulatory
  const total = subtotal + taxesAndFees;

  return {
    currency: "USD",
    cabinClass: CABIN_LABEL[cabinClass] ?? cabinClass,
    tripType,
    fastTransit,
    passengers,
    perPassenger,
    subtotal,
    taxesAndFees,
    total,
    humanTotal: `$${(total / 1_000_000).toFixed(2)}M`,
    breakdown: [
      `Base ${cabinClass} fare: $${base.toLocaleString()}/passenger`,
      tripType === "round-trip" ? "Round-trip x1.8" : "One-way x1.0",
      fastTransit ? "Fast-transit fusion service +40%" : "Standard Hohmann transfer",
      `Spaceport taxes & regulatory fees: 8%`,
    ],
  };
}
