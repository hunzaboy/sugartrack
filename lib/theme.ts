import type { ReadingStatus } from './types';

/**
 * Design tokens.
 *
 * Every colour pairing below is verified against WCAG 2.1 AA in sRGB. If you change
 * one, re-run the contrast check before committing — several of these values were
 * chosen specifically to clear 4.5:1, not for hue.
 *
 * The palette is intentionally flat rather than nested. `AccessibilityProvider`
 * swaps the whole object, so a dark palette is one more object of the same shape —
 * no call-site changes needed.
 */
export const colors = {
  background: '#F2F8F6',
  surface: '#FFFFFF',
  surfaceMuted: '#E8F4F1',

  /** Decorative dividers only — 1.28:1, deliberately below AA. */
  border: '#D8E7E3',
  /** Interactive borders (inputs, chips). 3.53:1 on surface, 3.28:1 on background. */
  borderStrong: '#6E8F88',

  text: '#17211F',
  textMuted: '#53645F',

  /** 5.20:1 against white text. Was #2E8B7A (4.13:1, failed AA for body text). */
  primary: '#1F7A68',
  primaryDark: '#155A4C',
  primarySoft: '#DDF1EC',
  primaryText: '#FFFFFF',
  /** Android ripple over a primary fill. */
  primaryRipple: 'rgba(255,255,255,0.24)',
  /** Android ripple over a light surface. */
  surfaceRipple: 'rgba(31,122,104,0.13)',

  danger: '#B83A32',
  dangerSoft: '#FBE8E6',

  /** Status foregrounds — all ≥5.7:1 on their paired *Bg below. */
  low: '#8A4B00',
  inRange: '#1B6B39',
  high: '#A32B22',
  lowBg: '#FFF1DC',
  inRangeBg: '#E3F4E8',
  highBg: '#FBE8E6',

  /** Snackbar / scrim. */
  inverseSurface: '#17211F',
  inverseText: '#F2F8F6',
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

/**
 * Explicit ramp with a hard 14px floor. Nothing may render below `caption`.
 *
 * The previous scale had five steps but ten rendered sizes, patched in by
 * subtracting from the smallest token (`fontSize.sm - 6` was a 10px chart axis).
 * Named steps make that impossible.
 */
export const fontSize = {
  caption: 14,
  body: 17,
  bodyLg: 20,
  title: 24,
  heading: 30,
  display: 36,
  hero: 52,
};

export const lineHeight = {
  caption: 20,
  body: 25,
  bodyLg: 28,
  title: 30,
  heading: 36,
  display: 40,
  hero: 56,
};

export const touchTarget = {
  minHeight: 56,
};

/**
 * Vertical offsets for the floating layer (FAB, snackbar).
 *
 * Both used to compute their own `bottom` independently and ended up overlapping.
 * `scale` is the in-app text scale, which grows the tab bar and the FAB.
 */
export const floatingOffset = {
  /** Bottom offset for a FAB sitting above the tab bar. */
  fab(bottomInset: number, scale = 1) {
    return bottomInset + touchTarget.minHeight * Math.max(scale, 1) + spacing.md;
  },
  /** Bottom offset for a snackbar, clearing the tab bar *and* the FAB above it. */
  snackbar(bottomInset: number, scale = 1) {
    return this.fab(bottomInset, scale) + touchTarget.minHeight * Math.max(scale, 1) + spacing.md;
  },
};

export const borderWidth = {
  hairline: 1,
  thin: 1.5,
  thick: 2,
};

export const iconSize = {
  sm: 20,
  md: 24,
  lg: 26,
  xl: 32,
};

export const chartHeight = {
  spark: 112,
  full: 260,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};

export const fontFamily = {
  regular: 'Inter_400Regular',
  bold: 'Inter_700Bold',
};

export const cardShadow = {
  shadowColor: '#123C34',
  shadowOpacity: 0.09,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 4,
};

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  low: 'Low',
  in_range: 'In range',
  high: 'High',
};

/**
 * Single source of truth for status colour and label. `StatusChip` and
 * `lib/chartData` both go through here — they used to each reimplement the
 * ternary and disagreed on the label ("In Range" vs "In range").
 */
export function statusColor(
  status: ReadingStatus,
  palette: typeof colors = colors
): { fg: string; bg: string; label: string } {
  switch (status) {
    case 'low':
      return { fg: palette.low, bg: palette.lowBg, label: STATUS_LABELS.low };
    case 'high':
      return { fg: palette.high, bg: palette.highBg, label: STATUS_LABELS.high };
    default:
      return { fg: palette.inRange, bg: palette.inRangeBg, label: STATUS_LABELS.in_range };
  }
}
