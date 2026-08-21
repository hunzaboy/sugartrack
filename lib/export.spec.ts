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

import { buildReadingsCsv, buildReadingsHtml } from './export';
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

  it('quotes CSV fields containing commas and quotes', () => {
    const csv = buildReadingsCsv([reading]);

    expect(csv).toContain('"Breakfast, ""light"""');
    expect(csv).toContain('Fasting');
  });

  it('escapes user-entered text in PDF HTML', () => {
    const html = buildReadingsHtml([{ ...reading, note: '<script>alert(1)</script>' }], profile);

    expect(html).toContain('&lt;Mary &amp; Sam&gt;');
    expect(html).toContain('Dr. &quot;Green&quot;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
