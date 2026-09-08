"use client";

type Booking = Record<string, unknown> & { status?: string; reference?: string };

const FIELDS: [string, string][] = [
  ["origin", "Departure spaceport"],
  ["destination", "Destination"],
  ["departureDate", "Departure date"],
  ["tripType", "Trip type"],
  ["returnDate", "Return date"],
  ["passengers", "Passengers"],
  ["leadPassenger", "Lead traveller"],
  ["email", "Email"],
  ["cabinClass", "Cabin class"],
];

const REQUIRED = [
  "origin",
  "destination",
  "departureDate",
  "passengers",
  "leadPassenger",
  "email",
  "cabinClass",
];

export default function BookingPanel({ booking }: { booking: Booking }) {
  const b = booking ?? {};
  const confirmed = b.status === "CONFIRMED";
  const done = REQUIRED.filter((f) => b[f] !== undefined && b[f] !== "").length;

  return (
    <div className="card">
      <div className="card-h">
        <h3>Booking draft</h3>
        <span className={`status ${confirmed ? "ok" : ""}`}>
          {confirmed ? "Confirmed" : `${done}/${REQUIRED.length} details`}
        </span>
      </div>

      <dl className="fields">
        {FIELDS.map(([key, label]) => {
          const value = b[key];
          const filled = value !== undefined && value !== null && value !== "";
          return (
            <div key={key} className={`field ${filled ? "filled" : ""}`}>
              <dt>{label}</dt>
              <dd>{filled ? String(value) : "—"}</dd>
            </div>
          );
        })}
      </dl>

      {b.reference ? <div className="ref">Ref&nbsp;{String(b.reference)}</div> : null}
    </div>
  );
}
