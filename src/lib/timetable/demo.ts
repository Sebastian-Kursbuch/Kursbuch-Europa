import type { Connection, Departure, Station, TimetableSource, TrainLeg } from './types';

/**
 * Beispieldaten, damit sich die App ohne Fahrplanserver ausprobieren lässt.
 * Strecken und Fahrzeiten sind grob an echte Verbindungen angelehnt,
 * Abfahrtszeiten sind erfunden (alle zwei Stunden).
 */

const STATIONS: Station[] = [
  { id: 'berlin', name: 'Berlin Hbf', area: 'Deutschland' },
  { id: 'frankfurt', name: 'Frankfurt (Main) Hbf', area: 'Deutschland' },
  { id: 'muenchen', name: 'München Hbf', area: 'Deutschland' },
  { id: 'paris-est', name: 'Paris Est', area: 'Frankreich' },
  { id: 'paris-lyon', name: 'Paris Gare de Lyon', area: 'Frankreich' },
  { id: 'zuerich', name: 'Zürich HB', area: 'Schweiz' },
  { id: 'wien', name: 'Wien Hbf', area: 'Österreich' },
  { id: 'budapest', name: 'Budapest-Keleti', area: 'Ungarn' },
  { id: 'barcelona', name: 'Barcelona Sants', area: 'Spanien' },
  { id: 'madrid', name: 'Madrid Puerta de Atocha', area: 'Spanien' },
];

type Line = {
  a: string;
  b: string;
  minutes: number;
  name: string;
  operator: string;
  /** Minute im Zwei-Stunden-Takt, zu der der erste Zug abfährt */
  offset: number;
};

const LINES: Line[] = [
  { a: 'berlin', b: 'muenchen', minutes: 240, name: 'ICE', operator: 'DB', offset: 4 },
  { a: 'berlin', b: 'frankfurt', minutes: 245, name: 'ICE', operator: 'DB', offset: 31 },
  { a: 'frankfurt', b: 'paris-est', minutes: 230, name: 'ICE', operator: 'DB / SNCF', offset: 58 },
  { a: 'muenchen', b: 'zuerich', minutes: 215, name: 'EC', operator: 'SBB / DB', offset: 33 },
  { a: 'muenchen', b: 'wien', minutes: 240, name: 'Railjet', operator: 'ÖBB', offset: 27 },
  { a: 'wien', b: 'budapest', minutes: 160, name: 'Railjet', operator: 'ÖBB / MÁV', offset: 42 },
  {
    a: 'zuerich',
    b: 'paris-lyon',
    minutes: 245,
    name: 'TGV Lyria',
    operator: 'SNCF / SBB',
    offset: 34,
  },
  { a: 'paris-lyon', b: 'barcelona', minutes: 400, name: 'TGV', operator: 'SNCF', offset: 70 },
  { a: 'barcelona', b: 'madrid', minutes: 150, name: 'AVE', operator: 'Renfe', offset: 0 },
];

const TIME_ZONE = 'Europe/Berlin';
const CYCLE = 120;
const MIN_TRANSFER = 10;
const MINUTE = 60_000;

type Trip = { line: Line; from: string; to: string; dep: number; arr: number };

const hourFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
});

/** Kein Betrieb zwischen 23 und 5 Uhr Ortszeit. */
function inService(minute: number) {
  const hour = Number(hourFormat.format(new Date(minute * MINUTE)));
  return hour >= 5 && hour < 23;
}

const byId = (id: string) => STATIONS.find((s) => s.id === id)!;

/** Alle Fahrten beider Richtungen, die in [start, end) abfahren (Minuten seit 1970). */
function tripsBetween(start: number, end: number): Trip[] {
  const trips: Trip[] = [];
  for (const line of LINES) {
    for (const [from, to, shift] of [
      [line.a, line.b, 0],
      [line.b, line.a, 60],
    ] as const) {
      const offset = line.offset + shift;
      let dep = Math.ceil((start - offset) / CYCLE) * CYCLE + offset;
      for (; dep < end; dep += CYCLE) {
        if (inService(dep)) trips.push({ line, from, to, dep, arr: dep + line.minutes });
      }
    }
  }
  return trips.sort((x, y) => x.dep - y.dep);
}

function toLeg(trip: Trip): TrainLeg {
  return {
    kind: 'train',
    name: trip.line.name,
    operator: trip.line.operator,
    headsign: byId(trip.to).name,
    departure: {
      station: byId(trip.from),
      scheduled: new Date(trip.dep * MINUTE).toISOString(),
      timeZone: TIME_ZONE,
    },
    arrival: {
      station: byId(trip.to),
      scheduled: new Date(trip.arr * MINUTE).toISOString(),
      timeZone: TIME_ZONE,
    },
  };
}

/** Früheste Ankunft ab `start` (einfacher Connection-Scan über einen Tag). */
function earliestJourney(from: string, to: string, start: number): Trip[] | undefined {
  const trips = tripsBetween(start, start + 24 * 60);
  const arrival = new Map<string, number>([[from, start]]);
  const via = new Map<string, Trip>();
  for (const trip of trips) {
    const ready = arrival.get(trip.from);
    if (ready === undefined) continue;
    const buffer = trip.from === from ? 0 : MIN_TRANSFER;
    if (ready + buffer > trip.dep) continue;
    if (trip.arr < (arrival.get(trip.to) ?? Infinity)) {
      arrival.set(trip.to, trip.arr);
      via.set(trip.to, trip);
    }
  }
  if (!via.has(to)) return undefined;
  const legs: Trip[] = [];
  for (let at = to; at !== from; ) {
    const trip = via.get(at)!;
    legs.unshift(trip);
    at = trip.from;
  }
  return legs;
}

export class DemoSource implements TimetableSource {
  readonly label = 'Beispielfahrplan';
  readonly isDemo = true;

  async searchStations(text: string): Promise<Station[]> {
    const needle = text.trim().toLowerCase();
    if (!needle) return [];
    return STATIONS.filter((s) => s.name.toLowerCase().includes(needle));
  }

  async findConnections(from: Station, to: Station, time: Date): Promise<Connection[]> {
    const connections: Connection[] = [];
    let start = Math.floor(time.getTime() / MINUTE);
    while (connections.length < 4) {
      const trips = earliestJourney(from.id, to.id, start);
      if (!trips) break;
      const first = trips[0];
      const last = trips[trips.length - 1];
      connections.push({
        id: `${from.id}-${to.id}-${first.dep}`,
        departure: new Date(first.dep * MINUTE).toISOString(),
        arrival: new Date(last.arr * MINUTE).toISOString(),
        durationMinutes: last.arr - first.dep,
        transfers: trips.length - 1,
        legs: trips.map(toLeg),
      });
      start = first.dep + 1;
    }
    return connections;
  }

  async departures(station: Station, time: Date): Promise<Departure[]> {
    const start = Math.floor(time.getTime() / MINUTE);
    return tripsBetween(start, start + 12 * 60)
      .filter((t) => t.from === station.id)
      .slice(0, 20)
      .map((t) => {
        const leg = toLeg(t);
        return {
          id: `${t.line.name}-${t.from}-${t.to}-${t.dep}`,
          name: leg.name,
          headsign: leg.headsign ?? '',
          operator: leg.operator,
          event: leg.departure,
        };
      });
  }
}
