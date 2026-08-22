import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText, Caption } from './Typography';
import { spacing, touchTarget, radius } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { toggleFeedback } from '../lib/haptics';

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/**
 * A switch whose whole row is the target.
 *
 * Before, the row reserved 56pt of height but only the switch itself was
 * tappable, and the Switch used platform defaults — rendering in Android's
 * default accent rather than the app's teal.
 */
export function SwitchRow({ label, description, value, onValueChange }: SwitchRowProps) {
  const { colors, scale } = useAccessibility();

  const toggle = () => {
    toggleFeedback(!value);
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      android_ripple={{ color: colors.surfaceRipple }}
      style={({ pressed }) => [
        styles.row,
        { minHeight: touchTarget.minHeight * Math.max(scale, 1) },
        pressed && { backgroundColor: colors.primarySoft },
      ]}
    >
      <View style={styles.text}>
        <AppText variant="bodyLg" bold>
          {label}
        </AppText>
        {description ? <Caption style={styles.description}>{description}</Caption> : null}
      </View>
      {/* Inert on purpose: the row is the only target. Left tappable, the switch
          would fire onValueChange *and* the row's onPress, toggling twice. */}
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
        <Switch
          value={value}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
});
