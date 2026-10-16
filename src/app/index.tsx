import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ConnectionCard } from '@/components/connection-card';
import { Screen } from '@/components/screen';
import { SourceNotice } from '@/components/source-notice';
import { StationSearch } from '@/components/station-search';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timetable, type Connection, type Station } from '@/lib/timetable';

export default function ConnectionScreen() {
  const theme = useTheme();
  const [from, setFrom] = useState<Station>();
  const [to, setTo] = useState<Station>();
  const [results, setResults] = useState<Connection[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const canSearch = from && to && from.id !== to.id && !loading;

  async function search() {
    if (!from || !to) return;
    setLoading(true);
    setError(undefined);
    try {
      setResults(await timetable.findConnections(from, to, new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Die Suche ist fehlgeschlagen.');
      setResults(undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Verbindung suchen">
      <SourceNotice />
      <StationSearch label="Von" value={from} onChange={setFrom} />
      <StationSearch label="Nach" value={to} onChange={setTo} />
      <Pressable
        disabled={!canSearch}
        onPress={search}
        style={[styles.button, { backgroundColor: theme.accent }, !canSearch && styles.disabled]}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          Ab jetzt suchen
        </ThemedText>
      </Pressable>

      {loading && <ActivityIndicator />}
      {error && <ThemedText style={{ color: theme.delay }}>{error}</ThemedText>}
      {results && results.length === 0 && (
        <ThemedText themeColor="textSecondary">Keine Bahnverbindung gefunden.</ThemedText>
      )}
      {results && results.length > 0 && (
        <View style={styles.results}>
          {results.map((c) => (
            <ConnectionCard key={c.id} connection={c} />
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Tippe auf eine Verbindung, um Züge und Umstiege zu sehen.
          </ThemedText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 16 },
  disabled: { opacity: 0.4 },
  results: { gap: Spacing.two },
});
