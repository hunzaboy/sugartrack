import { getDatabase } from './db';
import type { Medication } from './types';

export async function listMedications(): Promise<Medication[]> {
  const db = await getDatabase();
  return db.getAllAsync<Medication>('SELECT * FROM medications ORDER BY timestamp DESC');
}

export async function addMedication(name: string, dose: string, timestamp: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO medications (name, dose, timestamp) VALUES (?, ?, ?)',
    name,
    dose,
    timestamp
  );
}

export async function deleteMedication(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medications WHERE id = ?', id);
}
