import { formatTime } from './datetime';
import { statusColor } from './theme';
import { getReadingStatus } from './types';
import type { GlucoseUnit, Reading } from './types';

/** The whole control surface: two views, one toggle. */
export type ChartView = 'days' | 'time';

/**
 * Both views cover the same window, so the summary card always describes what
 * the chart is showing and there is no second control to reason about.
 */
export const CHART_WINDOW_DAYS = 30;

export const CHART_VIEWS: {
  value: ChartView;
  label: string;
  title: string;
  spacing: number;
}[] = [
  // Days: at most one label per calendar day ("21/8", ~26dp), so the slot only
  // has to clear that even when a day carries several points.
  // Time: every point is labelled ("4:15 pm", ~48dp).
  { value: 'days', label: 'By day', title: 'Readings by day', spacing: 40 },
  { value: 'time', label: 'By time', title: 'Readings by time', spacing: 60 },
];

export function chartViewConfig(view: ChartView) {
  return CHART_VIEWS.find((v) => v.value === view) ?? CHART_VIEWS[0];
}

export interface ChartDataPoint {
  /** Undefined on a day with no readings, so the gap stays a gap. */
  value?: number;
  /** Empty on the points of a day that already carries its date label. */
  label: string;
  dataPointColor?: string;
  hideDataPoint?: boolean;
  timestamp: string;
  context: string;
  /** How many readings that calendar day holds — context for the tooltip. */
  readingCount: number;
}

function statusDotColor(value: number, targetLow: number, targetHigh: number): string {
  return statusColor(getReadingStatus(value, targetLow, targetHigh)).fg;
}

/** "21/8" — comfortably narrower than the days view's spacing. */
function dayLabel(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * One point per reading — never an aggregate.
 *
 * The days view used to plot a single daily average, which is wrong for the
 * ordinary case: someone testing fasting, after lunch and at bedtime saw one
 * number that matched none of their three readings. Both views now plot every
 * reading and differ only in how the x-axis is labelled — by date, or by the
 * time each reading was taken.
 *
 * Days with no readings still emit a valueless, marker-less point so the axis
 * keeps calendar spacing instead of silently pulling a Monday next to a Friday.
 */
export function readingsToLineData(
  readings: Reading[],
  targetLow: number,
  targetHigh: number,
  view: ChartView = 'time',
  range?: { start: Date; end: Date }
): ChartDataPoint[] {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const byDay = new Map<string, Reading[]>();
  for (const reading of sorted) {
    const key = dayKey(new Date(reading.timestamp));
    byDay.set(key, [...(byDay.get(key) ?? []), reading]);
  }

  // Span the requested range when given one; otherwise just the days present.
  const timestamps = sorted.map((r) => new Date(r.timestamp).getTime());
  const first = range
    ? new Date(range.start)
    : new Date(timestamps.length ? timestamps[0] : Date.now());
  const last = range
    ? new Date(range.end)
    : new Date(timestamps.length ? timestamps[timestamps.length - 1] : Date.now());
  first.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  const points: ChartDataPoint[] = [];
  for (const cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor);
    const dayReadings = byDay.get(dayKey(day)) ?? [];

    if (dayReadings.length === 0) {
      points.push({
        label: dayLabel(day),
        hideDataPoint: true,
        timestamp: day.toISOString(),
        context: 'No readings',
        readingCount: 0,
      });
      continue;
    }

    // In the days view the date is written once per day, under the middle
    // point of that day's group, so a day with four readings reads as one
    // labelled cluster rather than four repetitions of the same date.
    const labelledIndex = Math.floor((dayReadings.length - 1) / 2);

    dayReadings.forEach((reading, index) => {
      points.push({
        value: reading.value,
        label:
          view === 'time'
            ? formatTime(reading.timestamp)
            : index === labelledIndex
              ? dayLabel(new Date(reading.timestamp))
              : '',
        dataPointColor: statusDotColor(reading.value, targetLow, targetHigh),
        timestamp: reading.timestamp,
        context: reading.context,
        readingCount: dayReadings.length,
      });
    });
  }

  return points;
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
 * Start of the chart window, aligned to midnight and inclusive of today.
 *
 * Subtracting the full day count from the current time reached back into an
 * extra calendar day, so a 30-day window produced 31 daily points.
 */
export function startOfWindow(days: number = CHART_WINDOW_DAYS): Date {
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
