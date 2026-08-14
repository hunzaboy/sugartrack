import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { fontSize, fontFamily, spacing, touchTarget, radius } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const { scale, colors } = useAccessibility();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        isPrimary && { backgroundColor: colors.primary },
        isDanger && { backgroundColor: colors.danger },
        !isPrimary && !isDanger && { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: fontSize.md * scale },
          (isPrimary || isDanger) && { color: colors.primaryText },
          !isPrimary && !isDanger && { color: colors.text },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.bold,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
