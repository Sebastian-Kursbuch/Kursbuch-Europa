import {
  client,
  geocode,
  plan,
  stoptimes,
  type Leg as MotisLeg,
  type Mode,
  type Place,
} from '@motis-project/motis-client';

import type { Connection, Leg, Station, StopEvent, TimetableSource } from './types';

/** Nur Bahnverkehr; Busse, Trams und U-Bahnen blendet die App aus. */
const RAIL_MODES: Mode[] = [
  'HIGHSPEED_RAIL',
  'LONG_DISTANCE',
  'NIGHT_RAIL',
  'REGIONAL_FAST_RAIL',
  'REGIONAL_RAIL',
  'RAIL',
];

const TRAIN_MODES = new Set<Mode>([...RAIL_MODES, 'SUBURBAN']);

function toStation(place: Place): Station {
  return { id: place.stopId ?? `${place.lat},${place.lon}`, name: place.name };
}

function toEvent(place: Place, which: 'arrival' | 'departure'): StopEvent {
  const scheduled = (which === 'arrival' ? place.scheduledArrival : place.scheduledDeparture) ?? '';
  const actual = which === 'arrival' ? place.arrival : place.departure;
  return {
    station: toStation(place),
    scheduled,
    actual: actual && actual !== scheduled ? actual : undefined,
    track: place.track ?? place.scheduledTrack,
    timeZone: place.tz,
  };
}

function toLeg(leg: MotisLeg): Leg {
  if (!TRAIN_MODES.has(leg.mode)) {
    return {
      kind: 'walk',
      minutes: Math.round(leg.duration / 60),
      from: toStation(leg.from),
      to: toStation(leg.to),
    };
  }
  return {
    kind: 'train',
    name: leg.displayName || leg.routeShortName || leg.tripShortName || 'Zug',
    operator: leg.agencyName,
    headsign: leg.headsign,
    departure: toEvent(leg.from, 'departure'),
    arrival: toEvent(leg.to, 'arrival'),
    cancelled: leg.cancelled,
  };
}

function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.data === undefined) {
    throw new Error('Der Fahrplanserver hat nicht geantwortet.');
  }
  return result.data;
}

/** Fahrplanauskunft über einen eigenen MOTIS-Server. */
export class MotisSource implements TimetableSource {
  readonly label: string;
  readonly isDemo = false;

  constructor(baseUrl: string) {
    client.setConfig({ baseUrl });
    this.label = new URL(baseUrl).host;
  }

  async searchStations(text: string): Promise<Station[]> {
    const matches = unwrap(
      await geocode({ query: { text, type: ['STOP'], mode: RAIL_MODES, language: ['de'] } }),
    );
    return matches.map((m) => ({
      id: m.id,
      name: m.name,
      area: m.areas?.find((a) => a.default)?.name ?? m.country,
    }));
  }

  async findConnections(from: Station, to: Station, time: Date): Promise<Connection[]> {
    const response = unwrap(
      await plan({
        query: {
          fromPlace: from.id,
          toPlace: to.id,
          time: time.toISOString(),
          transitModes: RAIL_MODES,
          numItineraries: 5,
          language: ['de'],
        },
      }),
    );
    return response.itineraries.map((it) => ({
      id: it.id,
      departure: it.startTime,
      arrival: it.endTime,
      durationMinutes: Math.round(it.duration / 60),
      transfers: it.transfers,
      legs: it.legs.map(toLeg),
    }));
  }

  async departures(station: Station, time: Date) {
    const response = unwrap(
      await stoptimes({
        query: {
          stopId: station.id,
          time: time.toISOString(),
          n: 20,
          mode: RAIL_MODES,
          language: ['de'],
        },
      }),
    );
    return response.stopTimes.map((st) => ({
      id: `${st.tripId}-${st.place.scheduledDeparture}`,
      name: st.displayName || st.routeShortName || st.tripShortName,
      headsign: st.headsign,
      operator: st.agencyName,
      event: toEvent(st.place, 'departure'),
      cancelled: st.cancelled || st.tripCancelled,
    }));
  }
}
