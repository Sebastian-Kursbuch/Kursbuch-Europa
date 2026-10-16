import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SourceNotice } from '@/components/source-notice';
import { StationSearch } from '@/components/station-search';
import { StopTime } from '@/components/stop-time';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timetable, type Departure, type Station } from '@/lib/timetable';

export default function DeparturesScreen() {
  const theme = useTheme();
  const [station, setStation] = useState<Station>();
  const [departures, setDepartures] = useState<Departure[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setDepartures(undefined);
    setError(undefined);
    if (!station) return;
    let active = true;
    timetable
      .departures(station, new Date())
      .then((d) => active && setDepartures(d))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen.'));
    return () => {
      active = false;
    };
  }, [station]);

  return (
    <Screen title="Abfahrten">
      <SourceNotice />
      <StationSearch label="Bahnhof" value={station} onChange={setStation} />

      {station && !departures && !error && <ActivityIndicator />}
      {error && <ThemedText style={{ color: theme.delay }}>{error}</ThemedText>}
      {departures && departures.length === 0 && (
        <ThemedText themeColor="textSecondary">Keine Abfahrten in den nächsten Stunden.</ThemedText>
      )}
      {departures && departures.length > 0 && (
        <ThemedView type="backgroundElement" style={styles.board}>
          {departures.map((d, i) => (
            <View
              key={d.id}
              style={[styles.row, i > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <StopTime event={d.event} bold />
              <View style={styles.train}>
                <ThemedText type="smallBold">
                  {d.name}
                  {d.cancelled ? ' – fällt aus' : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  nach {d.headsign}
                  {d.operator ? ` · ${d.operator}` : ''}
                </ThemedText>
              </View>
              {d.event.track && (
                <ThemedText type="small" themeColor="textSecondary">
                  Gl. {d.event.track}
                </ThemedText>
              )}
            </View>
          ))}
        </ThemedView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  board: { borderRadius: Spacing.two, paddingHorizontal: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  train: { flex: 1 },
});
