/**
 * Human-facing date and time formatting.
 *
 * The app previously rendered `new Date(...).toLocaleString()` directly, which
 * produces machine-ish output like "8/21/2026, 3:45:12 PM". For the primary
 * audience, "Today, 3:45 pm" is both faster to read and easier to trust.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days between two dates, ignoring time of day. Today = 0. */
export function dayOffset(iso: string, now: Date = new Date()): number {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / MS_PER_DAY);
}

/** "3:45 pm" */
export function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    .toLowerCase();
}

/** "Today" · "Yesterday" · "Monday" (within a week) · "21 August" · "21 August 2025" */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const offset = dayOffset(iso, now);
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Yesterday';

  const date = new Date(iso);
  if (offset > 1 && offset < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(
    undefined,
    sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' }
  );
}

/** "Today, 3:45 pm" — the standard reading timestamp. */
export function formatReadingTimestamp(iso: string, now: Date = new Date()): string {
  return `${formatDayLabel(iso, now)}, ${formatTime(iso)}`;
}

/**
 * "Fri 21 Aug, 3:45 pm" — for the date/time picker field.
 *
 * Deliberately compact: the long form ("Fri, August 21, 2026 at 3:45 pm") was
 * truncating inside the field at default text size, and truncating the *end*
 * hid the time, which is the part most likely to need checking.
 */
export function formatLongDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
  return `${day}, ${formatTime(iso)}`;
}

/** "HH:MM" 24-hour, the storage format for the daily reminder. */
export function toStorageTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Parse "HH:MM" into a Date today, for seeding a time picker. */
export function fromStorageTime(time: string, base: Date = new Date()): Date {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  const d = new Date(base);
  d.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

/** "8:00 am" from stored "08:00". */
export function formatStorageTime(time: string): string {
  return fromStorageTime(time)
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    .toLowerCase();
}
