import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timetable, type Station } from '@/lib/timetable';

type Props = {
  label: string;
  value?: Station;
  onChange: (station: Station | undefined) => void;
};

export function StationSearch({ label, value, onChange }: Props) {
  const theme = useTheme();
  const [text, setText] = useState(value?.name ?? '');
  const [suggestions, setSuggestions] = useState<Station[]>([]);

  useEffect(() => {
    if (value && text === value.name) {
      setSuggestions([]);
      return;
    }
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      timetable
        .searchStations(text)
        .then((found) => active && setSuggestions(found.slice(0, 6)))
        .catch(() => active && setSuggestions([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, value]);

  return (
    <View style={styles.wrapper}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          if (value) onChange(undefined);
        }}
        placeholder="Bahnhof eingeben"
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
        ]}
      />
      {suggestions.length > 0 && (
        <ThemedView type="backgroundElement" style={styles.list}>
          {suggestions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setText(s.name);
                setSuggestions([]);
                onChange(s);
              }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <ThemedText>{s.name}</ThemedText>
              {s.area && (
                <ThemedText type="small" themeColor="textSecondary">
                  {s.area}
                </ThemedText>
              )}
            </Pressable>
          ))}
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  list: { borderRadius: Spacing.two, overflow: 'hidden' },
  item: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  pressed: { opacity: 0.6 },
});
