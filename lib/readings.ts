import { getDatabase } from './db';
import type { Reading, ReadingContext, GlucoseUnit } from './types';

export interface NewReading {
  value: number;
  unit: GlucoseUnit;
  context: ReadingContext;
  timestamp: string;
  note: string | null;
  photo_uri: string | null;
}

export async function listReadings(): Promise<Reading[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reading>('SELECT * FROM readings ORDER BY timestamp DESC');
}

export async function getReading(id: number): Promise<Reading | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Reading>('SELECT * FROM readings WHERE id = ?', id);
  return rows[0] ?? null;
}

export async function getLatestReading(): Promise<Reading | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Reading>('SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1');
  return rows[0] ?? null;
}

export async function addReading(reading: NewReading): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO readings (value, unit, context, timestamp, note, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    reading.value,
    reading.unit,
    reading.context,
    reading.timestamp,
    reading.note,
    reading.photo_uri
  );
  return result.lastInsertRowId;
}

export async function updateReading(id: number, reading: NewReading): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE readings SET value = ?, unit = ?, context = ?, timestamp = ?, note = ?, photo_uri = ?
     WHERE id = ?`,
    reading.value,
    reading.unit,
    reading.context,
    reading.timestamp,
    reading.note,
    reading.photo_uri,
    id
  );
}

export async function deleteReading(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM readings WHERE id = ?', id);
}

export async function listReadingsInRange(startIso: string, endIso: string): Promise<Reading[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reading>(
    'SELECT * FROM readings WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    startIso,
    endIso
  );
}

export async function listRecentReadings(limit: number): Promise<Reading[]> {
  const db = await getDatabase();
  return db.getAllAsync<Reading>('SELECT * FROM readings ORDER BY timestamp DESC LIMIT ?', limit);
}
