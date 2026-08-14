import { colors } from './theme';
import { getReadingStatus } from './types';
import type { Reading } from './types';

export type ChartRange = 'day' | 'week' | 'month';

export const CHART_RANGES: { value: ChartRange; label: string; days: number }[] = [
  { value: 'day', label: 'Day', days: 1 },
  { value: 'week', label: 'Week', days: 7 },
  { value: 'month', label: 'Month', days: 30 },
];

function statusDotColor(value: number, targetLow: number, targetHigh: number): string {
  const status = getReadingStatus(value, targetLow, targetHigh);
  if (status === 'low') return colors.low;
  if (status === 'high') return colors.high;
  return colors.inRange;
}

export function readingsToLineData(
  readings: Reading[],
  targetLow: number,
  targetHigh: number
): { value: number; label: string; dataPointColor: string }[] {
  return [...readings]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading) => ({
      value: reading.value,
      label: new Date(reading.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dataPointColor: statusDotColor(reading.value, targetLow, targetHigh),
    }));
}

export function chartMaxValue(values: number[], targetHigh: number): number {
  const dataMax = values.length ? Math.max(...values) : 0;
  const rawMax = Math.max(dataMax, targetHigh) * 1.15;
  return Math.ceil(rawMax / 10) * 10;
}

export function startOfRange(range: ChartRange): Date {
  const days = CHART_RANGES.find((r) => r.value === range)?.days ?? 7;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start;
}
