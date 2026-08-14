import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { READING_CONTEXTS } from './types';
import type { Reading, Profile } from './types';

function contextLabel(context: string): string {
  return READING_CONTEXTS.find((c) => c.value === context)?.label ?? context;
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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

export async function exportReadingsCsv(readings: Reading[]): Promise<void> {
  const csv = buildReadingsCsv(readings);
  const file = new File(Paths.cache, `sugartrack-readings-${Date.now()}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Readings CSV' });
  }
}

function buildReadingsHtml(readings: Reading[], profile: Profile | null): string {
  const rows = readings
    .map(
      (r) => `
      <tr>
        <td>${new Date(r.timestamp).toLocaleString()}</td>
        <td>${r.value} ${r.unit}</td>
        <td>${contextLabel(r.context)}</td>
        <td>${r.note ?? ''}</td>
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
          ${profile?.name ? `Patient: ${profile.name}<br/>` : ''}
          ${profile ? `Target range: ${profile.target_low}-${profile.target_high} ${profile.unit}<br/>` : ''}
          Generated: ${new Date().toLocaleString()}<br/>
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

export async function exportReadingsPdf(readings: Reading[], profile: Profile | null): Promise<void> {
  const html = buildReadingsHtml(readings, profile);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Readings PDF' });
  }
}
