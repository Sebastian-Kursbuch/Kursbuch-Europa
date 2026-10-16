import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { timetable } from '@/lib/timetable';

/** Hinweis auf die Datenquelle; im Beispielmodus deutlich sichtbar. */
export function SourceNotice() {
  if (!timetable.isDemo) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Fahrplandaten: {timetable.label}. Alle Angaben ohne Gewähr.
      </ThemedText>
    );
  }
  return (
    <ThemedView type="backgroundSelected" style={styles.box}>
      <ThemedText type="smallBold">Beispielfahrplan</ThemedText>
      <ThemedText type="small">
        Diese Vorschau zeigt erfundene Abfahrtszeiten zwischen zehn europäischen Bahnhöfen. Echte
        Fahrpläne folgen, sobald der eigene Fahrplanserver läuft.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
});
