import { colors } from './theme';
import { getReadingStatus } from './types';
import type { GlucoseUnit, Reading } from './types';

export type ChartRange = 'day' | 'week' | 'month';

export const CHART_RANGES: { value: ChartRange; label: string; days: number }[] = [
  { value: 'day', label: 'Day', days: 1 },
  { value: 'week', label: 'Week', days: 7 },
  { value: 'month', label: 'Month', days: 30 },
];

export interface ChartDataPoint {
  value: number;
  label: string;
  dataPointColor: string;
  timestamp: string;
  context: string;
  readingCount: number;
}

function statusDotColor(value: number, targetLow: number, targetHigh: number): string {
  const status = getReadingStatus(value, targetLow, targetHigh);
  if (status === 'low') return colors.low;
  if (status === 'high') return colors.high;
  return colors.inRange;
}

export function readingsToLineData(
  readings: Reading[],
  targetLow: number,
  targetHigh: number,
  includeTime = false
): ChartDataPoint[] {
  return [...readings]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading) => ({
      value: reading.value,
      label: includeTime
        ? new Date(reading.timestamp).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })
        : new Date(reading.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dataPointColor: statusDotColor(reading.value, targetLow, targetHigh),
      timestamp: reading.timestamp,
      context: reading.context,
      readingCount: 1,
    }));
}

export function readingsToDailyLineData(
  readings: Reading[],
  targetLow: number,
  targetHigh: number
): ChartDataPoint[] {
  const byDay = new Map<string, Reading[]>();

  [...readings]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((reading) => {
      const date = new Date(reading.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      byDay.set(key, [...(byDay.get(key) ?? []), reading]);
    });

  return [...byDay.values()].map((dayReadings) => {
    const value = dayReadings.reduce((sum, reading) => sum + reading.value, 0) / dayReadings.length;
    const roundedValue = Math.round(value * 10) / 10;
    const firstReading = dayReadings[0];

    return {
      value: roundedValue,
      label: new Date(firstReading.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      dataPointColor: statusDotColor(roundedValue, targetLow, targetHigh),
      timestamp: firstReading.timestamp,
      context: 'Daily average',
      readingCount: dayReadings.length,
    };
  });
}

export function chartMaxValue(
  values: number[],
  targetHigh: number,
  unit: GlucoseUnit = 'mg/dL'
): number {
  const dataMax = values.length ? Math.max(...values) : 0;
  const rawMax = Math.max(dataMax, targetHigh) * 1.15;
  const step = unit === 'mmol/L' ? 1 : 10;
  return Math.ceil(rawMax / step) * step;
}

export function convertReadingsToUnit(readings: Reading[], unit: GlucoseUnit): Reading[] {
  return readings.map((reading) => {
    if (reading.unit === unit) return reading;
    const value = unit === 'mmol/L' ? reading.value / 18 : reading.value * 18;
    return { ...reading, value: Math.round(value * 10) / 10, unit };
  });
}

export function startOfRange(range: ChartRange): Date {
  const days = CHART_RANGES.find((r) => r.value === range)?.days ?? 7;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start;
}
