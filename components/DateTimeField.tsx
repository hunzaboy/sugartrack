import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fontSize, spacing, radius, touchTarget } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const { scale, colors } = useAccessibility();
  const date = new Date(value);

  const openTimePicker = (base: Date) => {
    DateTimePickerAndroid.open({
      value: base,
      mode: 'time',
      is24Hour: false,
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return;
        const next = new Date(base);
        next.setHours(picked.getHours(), picked.getMinutes());
        onChange(next.toISOString());
      },
    });
  };

  const openPicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      maximumDate: new Date(),
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return;
        const next = new Date(date);
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        openTimePicker(next);
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontSize: fontSize.sm * scale, color: colors.text }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${date.toLocaleString()}`}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background }]}
      >
        <Text style={{ fontSize: fontSize.md * scale, color: colors.text }}>{date.toLocaleString()}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTarget.minHeight,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
});
