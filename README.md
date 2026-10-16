# Kursbuch Europa

Bahn-Fahrplanauskunft für ganz Europa als App für Web, iOS und Android, gebaut mit [Expo](https://expo.dev) (React Native).

## Was der Prototyp kann

- **Verbindung suchen:** Start- und Zielbahnhof wählen, Verbindungen ab jetzt mit Zügen, Umstiegen und Fahrzeit.
- **Abfahrten:** die nächsten Züge an einem Bahnhof.

Ohne Fahrplanserver zeigt die App einen **Beispielfahrplan** mit erfundenen Abfahrtszeiten zwischen zehn europäischen Bahnhöfen (`src/lib/timetable/demo.ts`).

## Echte Fahrpläne

Die App spricht die Schnittstelle von [MOTIS](https://github.com/motis-project/motis) an. Sobald ein eigener MOTIS-Server läuft, wird seine Adresse in einer Datei `.env` eingetragen:

```
EXPO_PUBLIC_MOTIS_URL=https://fahrplan.example.org
```

Die öffentliche Instanz Transitous darf nicht verwendet werden, weil sie kommerzielle Nutzung ausschließt.

## Entwickeln

```bash
npm install
npm run web        # im Browser
npm start          # mit Expo Go auf dem Handy
npm run typecheck
```

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/app/` | Bildschirme (`index.tsx` Verbindungssuche, `abfahrten.tsx` Abfahrtstafel) |
| `src/components/` | Bausteine wie Bahnhofssuche und Verbindungskarte |
| `src/lib/timetable/` | Datenquellen: `motis.ts` (Server), `demo.ts` (Beispielfahrplan) |
