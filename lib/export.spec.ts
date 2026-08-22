import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-print', () => ({
  printToFileAsync: vi.fn(),
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(),
  shareAsync: vi.fn(),
}));

vi.mock('expo-file-system', () => ({
  Directory: class {},
  File: class {},
  Paths: { cache: 'cache' },
}));

import { buildReadingsHtml, formatExportDate, groupReadingsByDay } from './export';
import type { Profile, Reading } from './types';

const reading: Reading = {
  id: 1,
  value: 110,
  unit: 'mg/dL',
  context: 'fasting',
  timestamp: '2026-08-20T08:00:00.000Z',
  note: 'Breakfast, "light"',
  photo_uri: null,
};

const profile: Profile = {
  id: 1,
  name: '<Mary & Sam>',
  date_of_birth: null,
  diabetes_type: null,
  target_low: 70,
  target_high: 180,
  unit: 'mg/dL',
  doctor_name: 'Dr. "Green"',
  doctor_contact: 'office@example.com',
  last_backup_at: null,
  large_text: 0,
  reminder_enabled: 0,
  reminder_time: '08:00',
};

describe('readings export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('names the month so a date cannot be read the wrong way round', () => {
    // 05/08 vs 08/05 is a three-month error on a clinical record; a named
    // month removes the ambiguity. The name itself follows the locale.
    expect(formatExportDate(new Date(2026, 7, 5))).toMatch(/^05 \S+ 2026$/);
    expect(formatExportDate(new Date(2026, 7, 5))).not.toMatch(/\d\/\d/);
  });

  it('groups readings into one section per day, oldest first', () => {
    const days = groupReadingsByDay([
      { ...reading, id: 3, timestamp: '2026-08-21T09:00:00' },
      { ...reading, id: 1, timestamp: '2026-08-20T08:00:00' },
      { ...reading, id: 2, timestamp: '2026-08-20T19:00:00' },
    ]);

    expect(days).toHaveLength(2);
    expect(days[0].readings.map((r) => r.id)).toEqual([1, 2]);
    expect(days[1].readings.map((r) => r.id)).toEqual([3]);
  });

  it('marks fasting readings for the doctor, and leaves other contexts plain', () => {
    const html = buildReadingsHtml(
      [
        { ...reading, id: 1, context: 'fasting', timestamp: '2026-08-20T08:00:00' },
        { ...reading, id: 2, context: 'after_meal', timestamp: '2026-08-20T14:00:00' },
      ],
      profile
    );

    expect(html.match(/<tr class="fasting">/g)).toHaveLength(1);
    expect(html).toContain('<tr class="">');
    // The day heading carries the date, so the rows only need the time.
    expect(html).toMatch(/Thursday, 20 \S+ 2026/);
    expect(html).toContain('2 readings');
  });

  it('escapes user-entered text in PDF HTML', () => {
    const html = buildReadingsHtml([{ ...reading, note: '<script>alert(1)</script>' }], profile);

    expect(html).toContain('&lt;Mary &amp; Sam&gt;');
    expect(html).toContain('Dr. &quot;Green&quot;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
