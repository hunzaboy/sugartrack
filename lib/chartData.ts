import { statusColor } from './theme';
import { getReadingStatus } from './types';
import type { GlucoseUnit, Reading } from './types';

export type ChartRange = 'day' | 'week' | 'month' | 'quarter';

export const CHART_RANGES: { value: ChartRange; label: string; days: number }[] = [
  { value: 'day', label: 'Day', days: 1 },
  { value: 'week', label: 'Week', days: 7 },
  { value: 'month', label: 'Month', days: 30 },
  { value: 'quarter', label: '3 months', days: 90 },
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
  return statusColor(getReadingStatus(value, targetLow, targetHigh)).fg;
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

export type DayLabelStyle = 'weekday' | 'date';

/** "Fri" or "21/8" — both short enough never to be ellipsised by the chart. */
function dayLabel(iso: string, style: DayLabelStyle): string {
  const date = new Date(iso);
  if (style === 'weekday') {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function readingsToDailyLineData(
  readings: Reading[],
  targetLow: number,
  targetHigh: number,
  labelStyle: DayLabelStyle = 'date'
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
      label: dayLabel(firstReading.timestamp, labelStyle),
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

/**
 * Lower bound for the y-axis.
 *
 * Charts used to start at 0, so a set of readings between 110 and 150 occupied
 * about a sixth of the plot. Flooring just below the lower of the data and the
 * target band uses the height for the range that actually matters, while always
 * keeping the target low line visible.
 */
export function chartMinValue(
  values: number[],
  targetLow: number,
  unit: GlucoseUnit = 'mg/dL'
): number {
  const dataMin = values.length ? Math.min(...values) : targetLow;
  const step = unit === 'mmol/L' ? 1 : 10;
  const rawMin = Math.min(dataMin, targetLow) * 0.85;
  return Math.max(0, Math.floor(rawMin / step) * step);
}

export function convertReadingsToUnit(readings: Reading[], unit: GlucoseUnit): Reading[] {
  return readings.map((reading) => {
    if (reading.unit === unit) return reading;
    const value = unit === 'mmol/L' ? reading.value / 18 : reading.value * 18;
    return { ...reading, value: Math.round(value * 10) / 10, unit };
  });
}

/**
 * Start of a range, aligned to midnight and inclusive of today.
 *
 * Subtracting the full day count from the current time reached back into an
 * extra calendar day, so "Week" produced eight daily points instead of seven.
 */
export function startOfRange(range: ChartRange): Date {
  const days = CHART_RANGES.find((r) => r.value === range)?.days ?? 7;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}


export interface RangeStats {
  count: number;
  average: number;
  /** Percent of readings within the target band, 0-100. */
  timeInRange: number;
  lowCount: number;
  inRangeCount: number;
  highCount: number;
}

/**
 * Summary figures for the Trends screen. These are shown up front rather than
 * hidden behind a chart interaction — time in range is the number a clinician
 * asks about, and it should never require a tap to see.
 */
export function rangeStats(
  readings: Reading[],
  targetLow: number,
  targetHigh: number
): RangeStats | null {
  if (readings.length === 0) return null;

  let low = 0;
  let inRange = 0;
  let high = 0;
  let total = 0;

  for (const reading of readings) {
    total += reading.value;
    const status = getReadingStatus(reading.value, targetLow, targetHigh);
    if (status === 'low') low += 1;
    else if (status === 'high') high += 1;
    else inRange += 1;
  }

  return {
    count: readings.length,
    average: total / readings.length,
    timeInRange: Math.round((inRange / readings.length) * 100),
    lowCount: low,
    inRangeCount: inRange,
    highCount: high,
  };
}
