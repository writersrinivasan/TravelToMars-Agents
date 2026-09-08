/**
 * The Redstone Voyages knowledge base. These documents are chunked, embedded
 * and stored in an in-memory vector store at startup, then retrieved by the
 * agent's `search_knowledge_base` tool (Retrieval-Augmented Generation).
 *
 * Everything here is fictional world-building for the demo.
 */
export interface KnowledgeDoc {
  title: string;
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    title: "Fleet & Spacecraft",
    content: `Redstone Voyages operates a mixed Earth-Mars fleet.
- SpaceX Starship Ares-class: methalox reusable vehicles for the main passenger run. Ares-V carries business pods, Ares-VII "Olympus" carries First-class Olympus Suites, Ares-IX is the fusion-drive variant reserved for fast-transit service.
- Roscosmos Zarya-M nuclear transit tug: a nuclear-electric vehicle used for economy shared cryo-cabins on standard Hohmann transfers. Slower acceleration, larger volume, lowest cost per seat.
Every vehicle has triple-redundant life support, a storm shelter with 20 g/cm2 shielding for solar particle events, and a free-return abort trajectory for the first 40 hours after trans-Mars injection.
Cabin class to vehicle mapping: economy -> Zarya-M; business -> Ares-V; first -> Ares-VII; any fast-transit booking -> Ares-IX regardless of cabin class.`,
  },
  {
    title: "Launch Windows & Transit Times",
    content: `Earth and Mars align for an efficient Hohmann transfer roughly every 26 months. Redstone Voyages sells two transit products:
1. Standard Hohmann transfer: departures only during a launch window. Transit is about 7 months. Windows on the current timetable: HT-2026-11 (2026-11-10 to 2026-12-05), HT-2028-12 (2028-12-20 to 2029-01-18), HT-2031-01 (2031-01-25 to 2031-02-20).
2. Fast-transit fusion service: monthly departures outside the Hohmann windows aboard Starship Ares-IX. Transit is about 39 days. Fare carries a 40% surcharge. Minimum booking lead time is 21 days.
If a requested date is not inside a Hohmann window, the fast-transit option is offered automatically. Return legs from Mars follow the same window logic in reverse; a typical round trip includes a surface stay of 14 to 18 months when using standard transfers.`,
  },
  {
    title: "Fares, Cabin Classes & What's Included",
    content: `Base one-way fares per passenger: economy USD 2,500,000; business USD 6,000,000; first (Olympus Suite) USD 12,000,000.
Multipliers: round-trip x1.8 on the base fare; fast-transit fusion service +40%. Spaceport taxes and regulatory fees add 8% to the subtotal.
Included in every fare: 3-week pre-flight training, standard flight suit, in-transit meals and medical care, one surface transfer to Olympus Base, and 5 nights arrival accommodation.
Economy: shared cryo-cabin, supervised torpor sleep for most of the cruise, 25 kg personal allowance.
Business: private pod with a real bed, window, workstation, 40 kg allowance, priority centrifuge sessions.
First / Olympus Suite: 12 m2 private suite, concierge, 60 kg allowance, guaranteed surface excursion package, spacewalk option.
Children under 12 are not accepted on any service. Deposits and payment terms are covered in the cancellation policy.`,
  },
  {
    title: "Health & Medical Requirements",
    content: `All travellers must pass the Redstone Voyages Class II spaceflight medical, valid within 6 months of departure. Requirements:
- Age 18 to 65 at departure (waivers to 70 for business/first with a cardiology sign-off).
- Cardiovascular screening including a stress ECG; no uncontrolled hypertension or recent cardiac events.
- Bone density (DEXA) at or above a T-score of -1.5; a 6-month pre-flight bisphosphonate and resistance-exercise programme is mandatory below that.
- Centrifuge tolerance test to 3.5 g sustained for 30 seconds.
- No pregnancy; pregnancy is disqualifying for the entire trip duration.
- Vision correctable to 20/40; no history of raised intracranial pressure.
- Psychological evaluation for confinement and isolation tolerance.
Economy torpor (cryo-sleep) has extra criteria: BMI 18 to 32, no clotting disorders, no sleep apnoea. Passengers who fail torpor screening are rebooked into business at cost.
Cumulative mission radiation exposure is disclosed in writing and requires signed informed consent; a standard round trip is roughly 0.6 sievert.`,
  },
  {
    title: "Pre-flight Training",
    content: `Every ticket includes a mandatory 3-week residential training course completed in the 60 days before departure, at the departure spaceport (Boca Chica, Baikonur, Kourou or Sriharikota).
Curriculum: microgravity adaptation, emergency egress and fire drills, spacesuit donning, depressurisation response, waste and water systems, torpor induction and recovery (economy), and a 2-day Mars surface analogue exercise.
Attendance is pass/fail. Missing more than one day requires rescheduling to a later departure. Travellers who do not pass are offered a full refund minus the training cost, or one free re-attempt.
A lighter 5-day refresher applies to travellers who have flown with Redstone Voyages within the previous 30 months.`,
  },
  {
    title: "Baggage & Personal Cargo",
    content: `Personal allowance by cabin class: economy 25 kg, business 40 kg, first 60 kg. Dimensions must fit the 40 x 35 x 20 cm personal locker plus one soft 55 x 40 x 20 cm bag.
Prohibited: lithium cells above 100 Wh without pre-approval, pressurised containers, open flames, uncrated pets, firearms, perishable food, plants and soil (planetary protection).
Additional personal cargo can be shipped at USD 42,000 per kg on the same vehicle subject to mass budget, or USD 9,000 per kg on the next available cargo-only Starship (slower). All cargo is X-rayed and planetary-protection screened.
Medications must be declared with prescriptions; the ship's formulary covers most common needs.`,
  },
  {
    title: "Mars Arrival & Accommodation",
    content: `Passengers arrive at Olympus Base in Valles Marineris. On arrival: a 48-hour medical hold for gravity re-adaptation (Mars gravity is 0.38 g), then a base orientation.
Standard fares include 5 nights in the Olympus Base transit habitat: shared quarters for economy, private cabins for business and first. Extended stays are USD 1,800 per night economy, USD 4,500 business, USD 11,000 first, subject to life-support capacity.
Surface excursions (rover tours of the canyon rim, the ancient river delta, the ice-mining station) are included for first class and bookable a la carte otherwise. EVA suit excursions require an additional 2-day certification on Mars.
Connectivity to Earth has a light-speed delay of 3 to 22 minutes each way; there is no real-time voice or video with Earth.`,
  },
  {
    title: "Booking, Payment & Cancellation Policy",
    content: `A 20% deposit confirms a booking. Full payment is due 90 days before departure; bookings made inside 90 days are payable in full immediately.
Cancellation by the traveller: more than 180 days before departure, full refund minus a USD 25,000 admin fee. 180 to 90 days, 75% refund. 90 to 45 days, 50% refund. Inside 45 days, deposit is forfeited and only recoverable taxes are returned. Training costs already incurred are non-refundable.
Name changes are allowed up to 45 days out for a USD 15,000 fee, subject to the new traveller passing medical and training.
If Redstone Voyages slips the launch, travellers may rebook the next available departure at no charge or take a full refund including the admin fee.
Trip-interruption and medical-evacuation insurance is strongly recommended and can be purchased through Redstone Voyages up to 30 days before departure. Standard fares are not refundable for a failed medical after full payment unless insurance was purchased.`,
  },
  {
    title: "Earth Departure Spaceports",
    content: `Redstone Voyages departs from four Earth spaceports. The destination is always Mars (Olympus Base); other destinations such as the Moon or orbital hotels are not yet on sale.
- Boca Chica, Texas, USA: primary Starship site, all cabin classes, best fast-transit availability.
- Baikonur, Kazakhstan: home port of the Zarya-M nuclear tug, main economy departures.
- Kourou, French Guiana: equatorial launch site, business and first, good for round-trip Hohmann departures.
- Sriharikota, India: growing site, all classes, competitive economy pricing, monsoon-season schedule gaps in October and November.
Travellers complete their 3-week training at the same spaceport they depart from.`,
  },
  {
    title: "Safety, Insurance & Legal",
    content: `Spaceflight to Mars carries serious, disclosed risk to life. Every traveller signs an informed-consent and assumption-of-risk agreement, plus a cross-waiver of liability consistent with international launch practice and the Outer Space Treaty framework.
Safety systems: launch escape on all crewed Starships, dual independent life-support strings, a radiation storm shelter, a medical bay with a physician on every crossing, and a free-return abort during the early cruise phase.
Redstone Voyages carries third-party launch liability insurance as required by the launching states. Passenger life and medical-evacuation cover is the traveller's responsibility and is offered at booking.
Consular assistance on Mars is limited; Olympus Base operates under the operator's code of conduct. Dispute resolution is by binding arbitration seated in the jurisdiction of the departure spaceport.`,
  },
];
