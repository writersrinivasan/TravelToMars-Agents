import { NextResponse } from "next/server";
import { ticketStore } from "@/lib/bookings/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Simple admin view of every confirmed booking in this server process. */
export async function GET() {
  return NextResponse.json({
    count: ticketStore.size,
    bookings: Array.from(ticketStore.values()),
  });
}
