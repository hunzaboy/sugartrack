import { describe, expect, it } from 'vitest';
import {
  CHART_VIEWS,
  chartMaxValue,
  chartViewConfig,
  convertReadingsToUnit,
  readingsToLineData,
} from './chartData';
import { getReadingStatus } from './types';
import type { Reading } from './types';

function reading(id: number, value: number, timestamp: string): Reading {
  return {
    id,
    value,
    unit: 'mg/dL',
    context: 'fasting',
    timestamp,
    note: null,
    photo_uri: null,
  };
}

describe('chart data', () => {
  it('sorts all readings chronologically and includes time detail', () => {
    const result = readingsToLineData(
      [
        reading(2, 140, '2026-08-20T16:00:00.000Z'),
        reading(1, 100, '2026-08-20T08:00:00.000Z'),
      ],
      70,
      180,
      'time'
    );

    expect(result.map((point) => point.value)).toEqual([100, 140]);
    // Both are the same day, so each point carries that day's total.
    expect(result.every((point) => point.readingCount === 2)).toBe(true);
    expect(result[0].label).toMatch(/:/);
  });

  it('keeps every reading of a day as its own point in the days view', () => {
    // The common case: several readings a day. Averaging them showed a number
    // the user never measured, so both views plot each reading.
    const result = readingsToLineData(
      [
        reading(1, 100, '2026-08-19T08:00:00'),
        reading(2, 140, '2026-08-19T13:00:00'),
        reading(3, 160, '2026-08-19T21:00:00'),
        reading(4, 90, '2026-08-20T08:00:00'),
      ],
      70,
      180,
      'days'
    );

    expect(result.map((point) => point.value)).toEqual([100, 140, 160, 90]);
    // Every point of a day knows the day's total, for the tooltip.
    expect(result.slice(0, 3).every((point) => point.readingCount === 3)).toBe(true);
    // The date is written once per day, under the middle point of the group.
    expect(result.map((point) => point.label)).toEqual(['', '19/8', '', '20/8']);
  });

  it('labels every point with its time in the time view', () => {
    const result = readingsToLineData(
      [reading(1, 100, '2026-08-19T08:00:00'), reading(2, 140, '2026-08-19T13:00:00')],
      70,
      180,
      'time'
    );

    expect(result).toHaveLength(2);
    expect(result.every((point) => /:/.test(point.label))).toBe(true);
  });

  it('uses decimal-friendly chart scaling for mmol/L', () => {
    expect(chartMaxValue([8.2], 7.8, 'mmol/L')).toBe(10);
    expect(chartMaxValue([185], 180, 'mg/dL')).toBe(220);
  });

  it('converts historical readings to the selected profile unit', () => {
    const mmolReading = { ...reading(1, 126, '2026-08-20T08:00:00'), unit: 'mg/dL' as const };
    const [converted] = convertReadingsToUnit([mmolReading], 'mmol/L');

    expect(converted.value).toBe(7);
    expect(converted.unit).toBe('mmol/L');
  });

  it('emits a valueless point for a day with no readings', () => {
    // Aug 19 and Aug 21 have readings; Aug 20 does not. Without gap filling the
    // two would render adjacent and the x-axis would compress a missing day.
    const result = readingsToLineData(
      [reading(1, 100, '2026-08-19T08:00:00'), reading(2, 140, '2026-08-21T08:00:00')],
      70,
      180,
      'days',
      { start: new Date('2026-08-19T00:00:00'), end: new Date('2026-08-21T00:00:00') }
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ value: 100, readingCount: 1 });
    expect(result[1].value).toBeUndefined();
    expect(result[1]).toMatchObject({ readingCount: 0, hideDataPoint: true });
    expect(result[2]).toMatchObject({ value: 140, readingCount: 1 });
  });

  it('spans the requested range even when readings do not reach its edges', () => {
    const result = readingsToLineData(
      [reading(1, 100, '2026-08-20T08:00:00')],
      70,
      180,
      'days',
      { start: new Date('2026-08-18T00:00:00'), end: new Date('2026-08-22T00:00:00') }
    );

    expect(result).toHaveLength(5);
    expect(result.filter((point) => point.value !== undefined)).toHaveLength(1);
  });

  it('gives every view a label slot wider than its labels', () => {
    // gifted-charts sizes each x-axis label box to `spacing`, so this invariant
    // is what keeps labels from being ellipsised and then dropped.
    expect(CHART_VIEWS).toHaveLength(2);
    // Every point is labelled, so each view's slot must clear its widest label.
    for (const view of CHART_VIEWS) {
      expect(view.spacing).toBeGreaterThanOrEqual(40);
    }
    // "2:30 pm" is wider than "21/8", so the time view needs the roomier slot.
    expect(chartViewConfig('time').spacing).toBeGreaterThan(chartViewConfig('days').spacing);
  });

  it('treats target boundaries as in range', () => {
    expect(getReadingStatus(69.9, 70, 180)).toBe('low');
    expect(getReadingStatus(70, 70, 180)).toBe('in_range');
    expect(getReadingStatus(180, 70, 180)).toBe('in_range');
    expect(getReadingStatus(180.1, 70, 180)).toBe('high');
  });
});
