import type { StopEvent } from './timetable';

export function formatTime(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} Std. ${m.toString().padStart(2, '0')} Min.` : `${m} Min.`;
}

/** Verspätung in Minuten, oder undefined ohne Echtzeitdaten */
export function delayMinutes(event: StopEvent) {
  if (!event.actual) return undefined;
  return Math.round((Date.parse(event.actual) - Date.parse(event.scheduled)) / 60_000);
}

export function formatTransfers(count: number) {
  if (count === 0) return 'direkt';
  return count === 1 ? '1 Umstieg' : `${count} Umstiege`;
}
