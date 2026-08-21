import { describe, expect, it } from 'vitest';
import {
  chartMaxValue,
  convertReadingsToUnit,
  readingsToDailyLineData,
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
      true
    );

    expect(result.map((point) => point.value)).toEqual([100, 140]);
    expect(result.every((point) => point.readingCount === 1)).toBe(true);
    expect(result[0].label).toMatch(/:/);
  });

  it('groups same-day readings into a daily average', () => {
    const result = readingsToDailyLineData(
      [
        reading(1, 100, '2026-08-19T08:00:00'),
        reading(2, 140, '2026-08-19T18:00:00'),
        reading(3, 90, '2026-08-20T08:00:00'),
      ],
      70,
      180
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ value: 120, readingCount: 2, context: 'Daily average' });
    expect(result[1]).toMatchObject({ value: 90, readingCount: 1 });
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

  it('treats target boundaries as in range', () => {
    expect(getReadingStatus(69.9, 70, 180)).toBe('low');
    expect(getReadingStatus(70, 70, 180)).toBe('in_range');
    expect(getReadingStatus(180, 70, 180)).toBe('in_range');
    expect(getReadingStatus(180.1, 70, 180)).toBe('high');
  });
});
