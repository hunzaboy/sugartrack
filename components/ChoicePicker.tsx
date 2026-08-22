import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Label } from './Typography';
import { spacing, radius, touchTarget, borderWidth, iconSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { tapFeedback } from '../lib/haptics';

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

export function ChoicePicker<T extends string>({
  label,
  choices,
  value,
  onChange,
}: ChoicePickerProps<T>) {
  const { scale, colors } = useAccessibility();
  const minHeight = touchTarget.minHeight * Math.max(scale, 1);

  return (
    <View style={styles.container}>
      <Label style={styles.label}>{label}</Label>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={choice.value}
              onPress={() => {
                if (!selected) tapFeedback();
                onChange(choice.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={choice.label}
              android_ripple={{ color: selected ? colors.primaryRipple : colors.surfaceRipple }}
              style={({ pressed }) => [
                styles.chip,
                { minHeight, borderColor: colors.borderStrong, backgroundColor: colors.surface },
                selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                pressed && !selected && { backgroundColor: colors.primarySoft },
              ]}
            >
              {/* A check, not just a fill — selection is not carried by colour alone. */}
              {selected ? (
                <Ionicons
                  name="checkmark"
                  size={iconSize.sm * Math.max(scale, 1)}
                  color={colors.primaryText}
                />
              ) : null}
              <AppText
                variant="body"
                bold
                style={{ color: selected ? colors.primaryText : colors.text }}
              >
                {choice.label}
              </AppText>
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
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
  },
});
