import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { delayMinutes, formatTime } from '@/lib/format';
import type { StopEvent } from '@/lib/timetable';

/** Planzeit, dahinter die Verspätung, falls Echtzeitdaten vorliegen. */
export function StopTime({ event, bold }: { event: StopEvent; bold?: boolean }) {
  const theme = useTheme();
  const delay = delayMinutes(event);
  return (
    <View style={styles.row}>
      <ThemedText type={bold ? 'smallBold' : 'small'}>
        {formatTime(event.scheduled, event.timeZone)}
      </ThemedText>
      {delay !== undefined && (
        <ThemedText type="small" style={{ color: delay > 0 ? theme.delay : theme.onTime }}>
          {delay > 0 ? `+${delay}` : 'pünktlich'}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.one, minWidth: 48 },
});
