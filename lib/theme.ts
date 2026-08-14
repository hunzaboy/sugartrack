export const colors = {
  background: '#FFFFFF',
  surface: '#F5F7FA',
  border: '#D7DCE2',
  text: '#161B21',
  textMuted: '#4A5561',
  primary: '#1F6FEB',
  primaryText: '#FFFFFF',
  danger: '#C0392B',
  low: '#D9822B',
  inRange: '#1E8E3E',
  high: '#C0392B',
  lowBg: '#FCF0DF',
  inRangeBg: '#E6F4EA',
  highBg: '#FBEAE8',
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
  md: 12,
  lg: 16,
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
