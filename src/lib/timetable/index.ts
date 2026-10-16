import { DemoSource } from './demo';
import { MotisSource } from './motis';
import type { TimetableSource } from './types';

export * from './types';

/**
 * Mit gesetzter Umgebungsvariable EXPO_PUBLIC_MOTIS_URL fragt die App den
 * eigenen MOTIS-Server ab, sonst zeigt sie den Beispielfahrplan.
 */
const motisUrl = process.env.EXPO_PUBLIC_MOTIS_URL;

export const timetable: TimetableSource = motisUrl ? new MotisSource(motisUrl) : new DemoSource();
