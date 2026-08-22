import { useRef } from 'react';
import { Pressable, Animated, ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './Typography';
import { spacing, touchTarget, radius, borderWidth, iconSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { tapFeedback } from '../lib/haptics';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
  size?: 'md' | 'lg';
  /** Shows a spinner and blocks presses. Width does not change. */
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
  /** Screen-reader detail beyond the visible title. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
}

const PRESS_SCALE = 0.97;

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  icon,
  hint,
  style,
}: ButtonProps) {
  const { colors, scale } = useAccessibility();
  const press = useRef(new Animated.Value(0)).current;

  const isFilled = variant === 'primary' || variant === 'danger';
  const isQuiet = variant === 'quiet';
  const blocked = Boolean(disabled || loading);

  const fill = variant === 'primary' ? colors.primary : colors.danger;
  const pressedFill = variant === 'primary' ? colors.primaryDark : '#8A241E';

  const animate = (to: number) =>
    Animated.spring(press, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  const handlePress = () => {
    tapFeedback();
    onPress();
  };

  // Height grows with the in-app text scale so a 25% larger label never clips.
  const minHeight = (size === 'lg' ? touchTarget.minHeight : 48) * Math.max(scale, 1);
  const label = variant === 'danger' ? colors.primaryText : isFilled ? colors.primaryText : colors.text;

  return (
    <Animated.View
      style={{
        transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, PRESS_SCALE] }) }],
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => animate(1)}
        onPressOut={() => animate(0)}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={hint}
        accessibilityState={{ disabled: blocked, busy: loading }}
        android_ripple={
          isFilled
            ? { color: colors.primaryRipple, foreground: true }
            : { color: colors.surfaceRipple }
        }
        style={({ pressed }) => [
          styles.base,
          { minHeight },
          isFilled && { backgroundColor: pressed && Platform.OS !== 'android' ? pressedFill : fill },
          variant === 'secondary' && {
            backgroundColor: colors.surface,
            borderWidth: borderWidth.thick,
            borderColor: colors.borderStrong,
          },
          isQuiet && { backgroundColor: 'transparent' },
          isFilled && styles.elevated,
          blocked && styles.blocked,
          style,
        ]}
      >
        {/* Content stays mounted under the spinner so the button never changes width. */}
        <View style={[styles.row, loading && styles.hidden]}>
          {icon ? (
            <Ionicons name={icon} size={iconSize.md * Math.max(scale, 1)} color={label} />
          ) : null}
          <AppText variant="bodyLg" bold style={{ color: label }} numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {loading ? (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator color={label} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  elevated: {
    elevation: 2,
    shadowColor: '#123C34',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  hidden: {
    opacity: 0,
  },
  spinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocked: {
    opacity: 0.45,
    elevation: 0,
    shadowOpacity: 0,
  },
});
