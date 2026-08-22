import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { formatTime } from './datetime';
import { READING_CONTEXTS } from './types';
import type { Reading, Profile } from './types';

export interface PreparedExport {
  file: File;
  filename: string;
  mimeType: 'application/pdf' | 'application/zip';
}

function contextLabel(context: string): string {
  return READING_CONTEXTS.find((c) => c.value === context)?.label ?? context;
}

/**
 * "21 Aug 2026" — day first, with the month named.
 *
 * Any all-numeric date is ambiguous on a document that passes between people:
 * `toLocaleDateString()` wrote "08/21/2026" on a US device, and even a fixed
 * "21/08/2026" is read as 8 December by anyone assuming month/day. A named
 * month cannot be misread in either direction, which is what a clinical record
 * needs. The month name follows the device language, as the weekday does.
 */
export function formatExportDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  return `${day} ${month} ${date.getFullYear()}`;
}

/** "Thursday, 21 Aug 2026" — the day section heading. */
export function formatExportDayHeading(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  return `${weekday}, ${formatExportDate(date)}`;
}

/** "21/08/2026, 8:00 am" — for the generated-at stamp. */
function formatExportDateTime(date: Date): string {
  return `${formatExportDate(date)}, ${formatTime(date.toISOString())}`;
}

export interface ReadingDay {
  /** Midnight on the day, for heading and sort purposes. */
  date: Date;
  readings: Reading[];
}

/**
 * Readings split into one group per calendar day, oldest first.
 *
 * The report used to be one long undivided table, which left the doctor
 * scanning a repeated date column to work out where one day ended and the next
 * began. Days are now visible sections.
 */
export function groupReadingsByDay(readings: Reading[]): ReadingDay[] {
  const days = new Map<string, ReadingDay>();
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const reading of sorted) {
    const at = new Date(reading.timestamp);
    const date = new Date(at.getFullYear(), at.getMonth(), at.getDate());
    const key = date.toDateString();
    const day = days.get(key);
    if (day) day.readings.push(reading);
    else days.set(key, { date, readings: [reading] });
  }

  return [...days.values()];
}

function exportTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildReadingsHtml(readings: Reading[], profile: Profile | null): string {
  const days = groupReadingsByDay(readings);
  const unit = profile?.unit ?? readings[0]?.unit ?? 'mg/dL';
  const decimals = unit === 'mmol/L' ? 1 : 0;

  const body = days
    .map((day) => {
      const total = day.readings.reduce((sum, r) => sum + r.value, 0);
      const average = (total / day.readings.length).toFixed(decimals);
      const count =
        day.readings.length === 1 ? '1 reading' : `${day.readings.length} readings`;

      const rows = day.readings
        .map((r) => {
          // Fasting is the reading a doctor looks for first, so it is tinted
          // and rule-marked rather than left to be found by reading the
          // context column row by row.
          const fasting = r.context === 'fasting';
          return `
      <tr class="${fasting ? 'fasting' : ''}">
        <td class="time">${escapeHtml(formatTime(r.timestamp))}</td>
        <td class="value">${escapeHtml(`${r.value} ${r.unit}`)}</td>
        <td>${fasting ? '<span class="tag">' : ''}${escapeHtml(contextLabel(r.context))}${
          fasting ? '</span>' : ''
        }</td>
        <td class="note">${escapeHtml(r.note ?? '')}</td>
      </tr>`;
        })
        .join('');

      return `
      <tr class="day">
        <th colspan="4">
          <span class="day-date">${escapeHtml(formatExportDayHeading(day.date))}</span>
          <span class="day-meta">${escapeHtml(`${count} · average ${average} ${unit}`)}</span>
        </th>
      </tr>${rows}`;
    })
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          /* Print engines drop background colours unless told otherwise, and
             the fasting highlight is the whole point of the tint. */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { background: #FFFFFF; }
          body { font-family: -apple-system, Roboto, sans-serif; padding: 24px; color: #161B21; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #4A5561; font-size: 13px; margin-bottom: 12px; }
          .legend { font-size: 12px; color: #4A5561; margin-bottom: 16px; }
          .legend .swatch {
            display: inline-block; width: 10px; height: 10px; border-radius: 2px;
            background: #DBEAFE; border-left: 3px solid #1D4ED8; margin-right: 5px;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px 10px; font-size: 13px; }
          td { border-bottom: 1px solid #E4E8ED; }
          thead th { background: #F5F7FA; border-bottom: 1px solid #D7DCE2; }
          /* Keep a day heading with at least the start of its readings. */
          tr { page-break-inside: avoid; }
          tr.day th {
            background: #EDF1F6; border-top: 2px solid #C3CBD4; border-bottom: 1px solid #D7DCE2;
            padding-top: 10px; padding-bottom: 10px;
          }
          .day-date { font-size: 14px; }
          .day-meta { color: #4A5561; font-weight: normal; font-size: 12px; margin-left: 8px; }
          /* Fasting: tinted row plus a rule in the margin, so it survives a
             black-and-white printout. */
          tr.fasting td { background: #DBEAFE; }
          tr.fasting td.time { border-left: 3px solid #1D4ED8; font-weight: bold; }
          .tag { font-weight: bold; color: #1D4ED8; }
          .time { white-space: nowrap; }
          .value { white-space: nowrap; font-weight: bold; }
          .note { color: #4A5561; }
        </style>
      </head>
      <body>
        <h1>SugarTrack Blood Sugar Report</h1>
        <div class="meta">
          ${profile?.name ? `Patient: ${escapeHtml(profile.name)}<br/>` : ''}
          ${
            profile
              ? `Target range: ${escapeHtml(`${profile.target_low}-${profile.target_high} ${profile.unit}`)}<br/>`
              : ''
          }
          ${profile?.doctor_name ? `Doctor: ${escapeHtml(profile.doctor_name)}<br/>` : ''}
          ${profile?.doctor_contact ? `Doctor contact: ${escapeHtml(profile.doctor_contact)}<br/>` : ''}
          Generated: ${escapeHtml(formatExportDateTime(new Date()))}<br/>
          Total readings: ${readings.length} across ${days.length} ${days.length === 1 ? 'day' : 'days'}
        </div>
        <div class="legend"><span class="swatch"></span>Fasting readings are highlighted.</div>
        <table>
          <thead>
            <tr><th>Time</th><th>Value</th><th>Context</th><th>Note</th></tr>
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export async function prepareReadingsPdf(
  readings: Reading[],
  profile: Profile | null
): Promise<PreparedExport> {
  const html = buildReadingsHtml(readings, profile);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const filename = `sugartrack-report-${exportTimestamp()}.pdf`;
  const printedFile = new File(uri);
  const file = new File(Paths.cache, filename);
  await printedFile.copy(file, { overwrite: true });

  return { file, filename, mimeType: 'application/pdf' };
}

export async function savePreparedExport(preparedExport: PreparedExport): Promise<string | null> {
  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) return null;
    throw error;
  }

  const destination = directory.createFile(preparedExport.filename, preparedExport.mimeType);
  destination.write(await preparedExport.file.bytes());
  return destination.uri;
}

export async function sharePreparedExport(preparedExport: PreparedExport): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(preparedExport.file.uri, {
    mimeType: preparedExport.mimeType,
    dialogTitle: `Share ${preparedExport.filename}`,
  });
  return true;
}
