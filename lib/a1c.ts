import { getDatabase } from './db';
import type { A1cEntry } from './types';

export async function listA1c(): Promise<A1cEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<A1cEntry>('SELECT * FROM a1c_log ORDER BY date DESC');
}

export async function addA1c(value: number, date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO a1c_log (value, date) VALUES (?, ?)', value, date);
}

export async function deleteA1c(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM a1c_log WHERE id = ?', id);
}
