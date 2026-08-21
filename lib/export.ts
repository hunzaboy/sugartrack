import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { READING_CONTEXTS } from './types';
import type { Reading, Profile } from './types';

export interface PreparedExport {
  file: File;
  filename: string;
  mimeType: 'text/csv' | 'application/pdf' | 'application/zip';
}

function contextLabel(context: string): string {
  return READING_CONTEXTS.find((c) => c.value === context)?.label ?? context;
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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

export function buildReadingsCsv(readings: Reading[]): string {
  const header = ['Date/Time', 'Value', 'Unit', 'Context', 'Note'];
  const rows = readings.map((r) => [
    new Date(r.timestamp).toLocaleString(),
    String(r.value),
    r.unit,
    contextLabel(r.context),
    r.note ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

export function prepareReadingsCsv(readings: Reading[]): PreparedExport {
  const csv = buildReadingsCsv(readings);
  const filename = `sugartrack-readings-${exportTimestamp()}.csv`;
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  return { file, filename, mimeType: 'text/csv' };
}

export function buildReadingsHtml(readings: Reading[], profile: Profile | null): string {
  const rows = readings
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(new Date(r.timestamp).toLocaleString())}</td>
        <td>${escapeHtml(`${r.value} ${r.unit}`)}</td>
        <td>${escapeHtml(contextLabel(r.context))}</td>
        <td>${escapeHtml(r.note ?? '')}</td>
      </tr>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Roboto, sans-serif; padding: 24px; color: #161B21; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #4A5561; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #D7DCE2; font-size: 13px; }
          th { background: #F5F7FA; }
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
          Generated: ${escapeHtml(new Date().toLocaleString())}<br/>
          Total readings: ${readings.length}
        </div>
        <table>
          <thead>
            <tr><th>Date/Time</th><th>Value</th><th>Context</th><th>Note</th></tr>
          </thead>
          <tbody>
            ${rows}
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
