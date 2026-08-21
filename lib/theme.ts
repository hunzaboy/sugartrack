export const colors = {
  background: '#F2F8F6',
  surface: '#FFFFFF',
  surfaceMuted: '#E8F4F1',
  border: '#D8E7E3',
  text: '#17211F',
  textMuted: '#53645F',
  primary: '#2E8B7A',
  primaryDark: '#21665A',
  primarySoft: '#DDF1EC',
  primaryText: '#FFFFFF',
  danger: '#B83A32',
  low: '#D47B18',
  inRange: '#278A4B',
  high: '#C4473D',
  lowBg: '#FFF1DC',
  inRangeBg: '#E3F4E8',
  highBg: '#FBE8E6',
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  sm: 16,
  md: 20,
  lg: 26,
  xl: 34,
  xxl: 48,
};

export const touchTarget = {
  minHeight: 56,
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

import type { ReadingStatus } from './types';

export function statusColor(status: ReadingStatus): { fg: string; bg: string; label: string } {
  switch (status) {
    case 'low':
      return { fg: colors.low, bg: colors.lowBg, label: 'Low' };
    case 'high':
      return { fg: colors.high, bg: colors.highBg, label: 'High' };
    default:
      return { fg: colors.inRange, bg: colors.inRangeBg, label: 'In Range' };
  }
}
