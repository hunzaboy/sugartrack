import { View, Text, Pressable, StyleSheet } from 'react-native';
import { fontSize, fontFamily, spacing, radius, touchTarget } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface Choice<T extends string> {
  value: T;
  label: string;
}

interface ChoicePickerProps<T extends string> {
  label: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ChoicePicker<T extends string>({ label, choices, value, onChange }: ChoicePickerProps<T>) {
  const { scale, colors } = useAccessibility();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontSize: fontSize.sm * scale, color: colors.text }]}>{label}</Text>
      <View style={styles.row}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={choice.value}
              onPress={() => onChange(choice.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.background },
                selected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontSize: fontSize.sm * scale, color: colors.text },
                  selected && { color: colors.primaryText },
                ]}
              >
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.bold,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: touchTarget.minHeight,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  chipText: {
    fontFamily: fontFamily.bold,
  },
});
