export interface LaunchWindow {
  id: string;
  opens: string; // YYYY-MM-DD
  closes: string; // YYYY-MM-DD
  type: string;
  transit: string;
}

/**
 * Mars transfer opportunities recur roughly every 26 months. These are
 * fictional but plausible Hohmann windows for the Redstone Voyages timetable.
 */
export const HOHMANN_WINDOWS: LaunchWindow[] = [
  { id: "HT-2026-11", opens: "2026-11-10", closes: "2026-12-05", type: "Hohmann transfer", transit: "~7 months" },
  { id: "HT-2028-12", opens: "2028-12-20", closes: "2029-01-18", type: "Hohmann transfer", transit: "~7 months" },
  { id: "HT-2031-01", opens: "2031-01-25", closes: "2031-02-20", type: "Hohmann transfer", transit: "~7 months" },
];

const MIN_LEAD_DAYS = 21;

export function checkLaunchWindows(departureDate: string) {
  const date = new Date(`${departureDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return { input: departureDate, error: "Invalid date. Use YYYY-MM-DD format." };
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const leadDays = Math.floor((date.getTime() - today.getTime()) / 86_400_000);

  const inWindow = HOHMANN_WINDOWS.find(
    (w) => departureDate >= w.opens && departureDate <= w.closes,
  );
  const searchFrom = departureDate > todayStr ? departureDate : todayStr;
  const nextHohmannWindow =
    HOHMANN_WINDOWS.find((w) => w.opens >= searchFrom) ??
    HOHMANN_WINDOWS.find((w) => w.opens >= todayStr) ??
    null;

  if (inWindow) {
    return {
      input: departureDate,
      leadDays,
      inLaunchWindow: true,
      window: inWindow,
      recommendation: "standard" as const,
      note: `Date falls inside Hohmann window ${inWindow.id} (${inWindow.opens} to ${inWindow.closes}). Standard transfer, ${inWindow.transit} transit.`,
    };
  }

  const fastTransitAvailable = leadDays >= MIN_LEAD_DAYS;
  return {
    input: departureDate,
    leadDays,
    inLaunchWindow: false,
    window: null,
    nextHohmannWindow,
    recommendation: fastTransitAvailable ? ("fast-transit" as const) : ("too-soon" as const),
    note: fastTransitAvailable
      ? `No Hohmann window on this date. The premium fast-transit fusion service is available (monthly departures, ~39 days transit, +40% fare). Nearest standard window: ${nextHohmannWindow?.id ?? "n/a"}.`
      : `Departure is only ${leadDays} days away; the minimum lead time is ${MIN_LEAD_DAYS} days. Please choose a later date.`,
  };
}
