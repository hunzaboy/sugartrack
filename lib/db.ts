import * as SQLite from 'expo-sqlite';
import type { Profile } from './types';

export const DATABASE_NAME = 'sugartrack.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT,
  date_of_birth TEXT,
  diabetes_type TEXT,
  target_low INTEGER NOT NULL DEFAULT 70,
  target_high INTEGER NOT NULL DEFAULT 180,
  unit TEXT NOT NULL DEFAULT 'mg/dL',
  doctor_name TEXT,
  doctor_contact TEXT,
  last_backup_at TEXT,
  large_text INTEGER NOT NULL DEFAULT 0,
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT NOT NULL DEFAULT '08:00'
);

CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mg/dL',
  context TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  note TEXT,
  photo_uri TEXT
);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  linked_reading_id INTEGER,
  FOREIGN KEY (linked_reading_id) REFERENCES readings(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_medications_timestamp ON medications(timestamp);

CREATE TABLE IF NOT EXISTS a1c_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value REAL NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weight_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value REAL NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bp_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  date TEXT NOT NULL
);
`;

const MIGRATION_COLUMNS = [
  { table: 'profile', column: 'large_text', ddl: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'profile', column: 'reminder_enabled', ddl: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'profile', column: 'reminder_time', ddl: "TEXT NOT NULL DEFAULT '08:00'" },
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const { table, column, ddl } of MIGRATION_COLUMNS) {
    try {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    } catch {
      // column already exists
    }
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await dbInstance.execAsync(SCHEMA);
  await migrate(dbInstance);
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

export async function getProfile(): Promise<Profile | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Profile>('SELECT * FROM profile WHERE id = 1');
  return rows[0] ?? null;
}

export async function createProfile(
  profile: Omit<Profile, 'id' | 'last_backup_at' | 'large_text' | 'reminder_enabled' | 'reminder_time'>
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO profile (id, name, date_of_birth, diabetes_type, target_low, target_high, unit, doctor_name, doctor_contact)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    profile.name,
    profile.date_of_birth,
    profile.diabetes_type,
    profile.target_low,
    profile.target_high,
    profile.unit,
    profile.doctor_name,
    profile.doctor_contact
  );
}

export async function updateProfile(profile: Partial<Omit<Profile, 'id'>>): Promise<void> {
  const db = await getDatabase();
  const fields = Object.keys(profile);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => (profile as Record<string, unknown>)[f]);
  await db.runAsync(`UPDATE profile SET ${setClause} WHERE id = 1`, ...(values as (string | number | null)[]));
}
