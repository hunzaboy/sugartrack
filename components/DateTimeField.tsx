import { View, Pressable, StyleSheet } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Label } from './Typography';
import { spacing, radius, touchTarget, borderWidth, iconSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { tapFeedback } from '../lib/haptics';
import { formatLongDateTime, formatTime } from '../lib/datetime';

interface DateTimeFieldProps {
  label: string;
  /** ISO string. */
  value: string;
  onChange: (iso: string) => void;
  /** 'datetime' chains a date picker into a time picker. 'time' asks only for a time. */
  mode?: 'datetime' | 'time';
  /** Reject values in the future. Readings can't be logged ahead of time. */
  noFuture?: boolean;
  help?: string;
}

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
  noFuture = false,
  help,
}: DateTimeFieldProps) {
  const { scale, colors } = useAccessibility();
  const date = new Date(value);

  const commit = (next: Date) => {
    // The date step can be clamped by maximumDate, but the time step cannot —
    // picking "today" then a later hour would otherwise store a future reading.
    if (noFuture && next.getTime() > Date.now()) {
      onChange(new Date().toISOString());
      return;
    }
    onChange(next.toISOString());
  };

  const openTimePicker = (base: Date) => {
    DateTimePickerAndroid.open({
      value: base,
      mode: 'time',
      is24Hour: false,
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return;
        const next = new Date(base);
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        commit(next);
      },
    });
  };

  const openPicker = () => {
    tapFeedback();
    if (mode === 'time') {
      openTimePicker(date);
      return;
    }
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      maximumDate: noFuture ? new Date() : undefined,
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return;
        const next = new Date(date);
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        openTimePicker(next);
      },
    });
  };

  const display = mode === 'time' ? formatTime(value) : formatLongDateTime(value);

  return (
    <View style={styles.container}>
      <Label style={styles.label}>{label}</Label>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        accessibilityHint={mode === 'time' ? 'Opens a time picker' : 'Opens a date and time picker'}
        android_ripple={{ color: colors.surfaceRipple }}
        style={({ pressed }) => [
          styles.input,
          {
            minHeight: touchTarget.minHeight * Math.max(scale, 1),
            borderColor: colors.borderStrong,
            backgroundColor: colors.surface,
          },
          pressed && { backgroundColor: colors.primarySoft },
        ]}
      >
        <Ionicons
          name={mode === 'time' ? 'time-outline' : 'calendar-outline'}
          size={iconSize.md}
          color={colors.primary}
        />
        <AppText variant="bodyLg" style={styles.value} numberOfLines={1}>
          {display}
        </AppText>
        <Ionicons name="chevron-down" size={iconSize.sm} color={colors.textMuted} />
      </Pressable>
      {help ? <AppText variant="caption" tone="muted" style={styles.help}>{help}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: borderWidth.thin,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  value: {
    flex: 1,
  },
  help: {
    marginTop: spacing.xs,
  },
});
