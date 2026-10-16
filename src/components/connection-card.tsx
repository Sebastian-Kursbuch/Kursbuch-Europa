import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { StopTime } from '@/components/stop-time';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatTime, formatTransfers } from '@/lib/format';
import type { Connection, TrainLeg } from '@/lib/timetable';

export function ConnectionCard({ connection }: { connection: Connection }) {
  const [open, setOpen] = useState(false);
  const trains = connection.legs.filter((l): l is TrainLeg => l.kind === 'train');
  const first = trains[0];
  const last = trains[trains.length - 1];
  const zone = first?.departure.timeZone;

  return (
    <Pressable onPress={() => setOpen(!open)}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.summary}>
          <ThemedText type="smallBold" style={styles.times}>
            {formatTime(connection.departure, zone)} –{' '}
            {formatTime(connection.arrival, last?.arrival.timeZone)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDuration(connection.durationMinutes)} · {formatTransfers(connection.transfers)}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {trains.map((t) => t.name).join(' → ')}
        </ThemedText>
        {open && (
          <View style={styles.legs}>
            {connection.legs.map((leg, i) =>
              leg.kind === 'train' ? (
                <LegRow key={i} leg={leg} />
              ) : (
                <ThemedText key={i} type="small" themeColor="textSecondary">
                  {leg.minutes} Min. Fußweg zu {leg.to.name}
                </ThemedText>
              ),
            )}
          </View>
        )}
      </ThemedView>
    </Pressable>
  );
}

function LegRow({ leg }: { leg: TrainLeg }) {
  const theme = useTheme();
  return (
    <View style={[styles.leg, { borderLeftColor: theme.accent }]}>
      <ThemedText type="smallBold">
        {leg.name}
        {leg.headsign ? ` Richtung ${leg.headsign}` : ''}
        {leg.cancelled ? ' – fällt aus' : ''}
      </ThemedText>
      {leg.operator && (
        <ThemedText type="small" themeColor="textSecondary">
          {leg.operator}
        </ThemedText>
      )}
      <Stop label={leg.departure.station.name} track={leg.departure.track}>
        <StopTime event={leg.departure} />
      </Stop>
      <Stop label={leg.arrival.station.name} track={leg.arrival.track}>
        <StopTime event={leg.arrival} />
      </Stop>
    </View>
  );
}

function Stop({
  label,
  track,
  children,
}: {
  label: string;
  track?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stop}>
      {children}
      <ThemedText type="small" style={styles.stopName}>
        {label}
      </ThemedText>
      {track && (
        <ThemedText type="small" themeColor="textSecondary">
          Gl. {track}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  times: { fontSize: 16 },
  legs: { marginTop: Spacing.two, gap: Spacing.three },
  leg: { borderLeftWidth: 3, paddingLeft: Spacing.three, gap: Spacing.one },
  stop: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  stopName: { flex: 1 },
});
