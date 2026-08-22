import { Text, StyleSheet } from 'react-native';
import type { TextProps, TextStyle, StyleProp } from 'react-native';
import { fontFamily, fontSize, lineHeight } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

type Variant = keyof typeof fontSize;
type Tone = 'default' | 'muted' | 'primary' | 'danger' | 'inverse';

interface AppTextProps extends Omit<TextProps, 'style'> {
  variant?: Variant;
  tone?: Tone;
  bold?: boolean;
  /** Uppercase eyebrow treatment with tracking. */
  eyebrow?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * The single way text enters the UI.
 *
 * Everything a Text needs in order to be correct — the Inter family, the in-app
 * scale, the palette, and the OS font-scale cap — is applied here rather than at
 * the call site. That is deliberate: the previous code applied `scale` at only 8
 * of ~40 text styles and set `fontWeight` without `fontFamily` in 10 places,
 * which silently rendered those in system Roboto instead of Inter. Both bugs are
 * unrepresentable if all text goes through this component.
 */
export function AppText({
  variant = 'body',
  tone = 'default',
  bold = false,
  eyebrow = false,
  style,
  ...props
}: AppTextProps) {
  const { scale, colors, maxFontSizeMultiplier } = useAccessibility();

  const toneColor: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    danger: colors.danger,
    inverse: colors.inverseText,
  };

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[
        {
          fontFamily: bold || eyebrow ? fontFamily.bold : fontFamily.regular,
          fontSize: fontSize[variant] * scale,
          lineHeight: lineHeight[variant] * scale,
          color: toneColor[tone],
        },
        eyebrow && styles.eyebrow,
        style,
      ]}
    />
  );
}

/** Page-level title. One per screen. */
export function ScreenTitle({ style, ...props }: AppTextProps) {
  return (
    <AppText
      accessibilityRole="header"
      variant="heading"
      bold
      {...props}
      style={[styles.screenTitle, style]}
    />
  );
}

/** Groups within a screen. */
export function SectionTitle({ style, ...props }: AppTextProps) {
  return (
    <AppText
      accessibilityRole="header"
      variant="title"
      bold
      {...props}
      style={[styles.sectionTitle, style]}
    />
  );
}

/** Default running text. */
export function Body({ ...props }: AppTextProps) {
  return <AppText variant="body" {...props} />;
}

/** Smallest permitted text — 14px floor. Timestamps, axis labels, helper copy. */
export function Caption({ ...props }: AppTextProps) {
  return <AppText variant="caption" tone="muted" {...props} />;
}

/** Form and control labels. */
export function Label({ ...props }: AppTextProps) {
  return <AppText variant="body" bold {...props} />;
}

/** Uppercase section eyebrow, e.g. "LATEST READING". */
export function Eyebrow({ ...props }: AppTextProps) {
  return <AppText variant="caption" tone="muted" eyebrow {...props} />;
}

const styles = StyleSheet.create({
  screenTitle: {
    letterSpacing: -0.4,
    marginBottom: 24,
  },
  sectionTitle: {
    letterSpacing: -0.2,
    marginBottom: 18,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
