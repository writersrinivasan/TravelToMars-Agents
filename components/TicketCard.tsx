"use client";

interface Ticket {
  reference: string;
  status: string;
  origin: string;
  arrivalHub?: string;
  departureDate: string;
  returnDate?: string | null;
  tripType: string;
  launchWindow: string;
  transit: string;
  passengers: number;
  leadPassenger: string;
  email: string;
  cabinClass: string;
  spacecraft: string;
  price?: {
    humanTotal?: string;
    total?: number;
    perPassenger?: number;
    passengers?: number;
    tripType?: string;
  };
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const p = ticket.price ?? {};
  const total =
    p.humanTotal ?? (p.total ? `$${p.total.toLocaleString()}` : "—");

  return (
    <div className="ticket">
      <div className="ticket-top">
        <span>BOARDING PASS</span>
        <span>{ticket.status}</span>
      </div>

      <div className="route">
        <div>
          <b>{ticket.origin}</b>
          <small>Earth</small>
        </div>
        <div className="arrow">→ 🪐</div>
        <div>
          <b>MARS</b>
          <small>{ticket.arrivalHub ?? "Olympus Base"}</small>
        </div>
      </div>

      <div className="ticket-grid">
        <div>
          <small>Reference</small>
          <b className="mono">{ticket.reference}</b>
        </div>
        <div>
          <small>Departure</small>
          <b>{ticket.departureDate}</b>
        </div>
        <div>
          <small>Transit</small>
          <b>{ticket.transit}</b>
        </div>
        <div>
          <small>Launch window</small>
          <b>{ticket.launchWindow}</b>
        </div>
        <div>
          <small>Cabin</small>
          <b>{ticket.cabinClass}</b>
        </div>
        <div>
          <small>Trip</small>
          <b>{ticket.tripType}</b>
        </div>
        <div>
          <small>Passengers</small>
          <b>{ticket.passengers}</b>
        </div>
        <div>
          <small>Lead traveller</small>
          <b>{ticket.leadPassenger}</b>
        </div>
        <div className="wide">
          <small>Spacecraft</small>
          <b>{ticket.spacecraft}</b>
        </div>
      </div>

      <div className="ticket-foot">
        <span>
          Total&nbsp;·&nbsp;{p.passengers ?? ticket.passengers}×&nbsp;
          {p.tripType ?? ticket.tripType}
        </span>
        <b>{total}</b>
      </div>
    </div>
  );
}
