export type ReadingContext =
  | 'fasting'
  | 'before_meal'
  | 'after_meal'
  | 'bedtime'
  | 'random';

export const READING_CONTEXTS: { value: ReadingContext; label: string }[] = [
  { value: 'fasting', label: 'Fasting' },
  { value: 'before_meal', label: 'Before Meal' },
  { value: 'after_meal', label: 'After Meal' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'random', label: 'Random' },
];

export type GlucoseUnit = 'mg/dL' | 'mmol/L';

export interface Profile {
  id: 1;
  name: string | null;
  date_of_birth: string | null;
  diabetes_type: string | null;
  target_low: number;
  target_high: number;
  unit: GlucoseUnit;
  doctor_name: string | null;
  doctor_contact: string | null;
  last_backup_at: string | null;
  large_text: number;
  reminder_enabled: number;
  reminder_time: string;
}

export interface Reading {
  id: number;
  value: number;
  unit: GlucoseUnit;
  context: ReadingContext;
  timestamp: string;
  note: string | null;
  photo_uri: string | null;
}

export interface Medication {
  id: number;
  name: string;
  dose: string;
  timestamp: string;
  linked_reading_id: number | null;
}

export interface A1cEntry {
  id: number;
  value: number;
  date: string;
}

export interface WeightEntry {
  id: number;
  value: number;
  date: string;
}

export interface BpEntry {
  id: number;
  systolic: number;
  diastolic: number;
  date: string;
}

export type ReadingStatus = 'low' | 'in_range' | 'high';

export function getReadingStatus(
  value: number,
  targetLow: number,
  targetHigh: number
): ReadingStatus {
  if (value < targetLow) return 'low';
  if (value > targetHigh) return 'high';
  return 'in_range';
}
