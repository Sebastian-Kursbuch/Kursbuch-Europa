/**
 * App-eigene Fahrplan-Typen. Die Bildschirme kennen nur diese Typen,
 * nicht die Datenquelle dahinter (MOTIS-Server oder Beispieldaten).
 */

export type Station = {
  id: string;
  name: string;
  /** Zusatz wie Land oder Region, falls bekannt */
  area?: string;
};

export type StopEvent = {
  station: Station;
  /** ISO-Zeitpunkt laut Fahrplan */
  scheduled: string;
  /** ISO-Zeitpunkt mit Verspätung, falls Echtzeitdaten vorliegen */
  actual?: string;
  track?: string;
  /** IANA-Zeitzone des Halts, z. B. Europe/Paris */
  timeZone?: string;
};

export type TrainLeg = {
  kind: 'train';
  /** Zugname, z. B. "ICE 371" oder "TGV 9575" */
  name: string;
  operator?: string;
  /** Endziel des Zuges */
  headsign?: string;
  departure: StopEvent;
  arrival: StopEvent;
  cancelled?: boolean;
};

export type WalkLeg = {
  kind: 'walk';
  minutes: number;
  from: Station;
  to: Station;
};

export type Leg = TrainLeg | WalkLeg;

export type Connection = {
  id: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  transfers: number;
  legs: Leg[];
};

export type Departure = {
  id: string;
  name: string;
  headsign: string;
  operator?: string;
  event: StopEvent;
  cancelled?: boolean;
};

export interface TimetableSource {
  /** Kurzer Hinweis, woher die Daten stammen (für die Anzeige) */
  readonly label: string;
  readonly isDemo: boolean;
  searchStations(text: string): Promise<Station[]>;
  findConnections(from: Station, to: Station, time: Date): Promise<Connection[]>;
  departures(station: Station, time: Date): Promise<Departure[]>;
}
