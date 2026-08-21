import { useState } from 'react';
import { ScrollView, StyleSheet, Alert, View, Text } from 'react-native';
import { Field } from './Field';
import { ChoicePicker } from './ChoicePicker';
import { Button } from './Button';
import { PhotoPicker } from './PhotoPicker';
import { DateTimeField } from './DateTimeField';
import { cardShadow, colors, fontFamily, fontSize, radius, spacing } from '../lib/theme';
import { READING_CONTEXTS } from '../lib/types';
import type { Reading, ReadingContext, GlucoseUnit } from '../lib/types';

interface ReadingFormProps {
  initial?: Reading;
  unit: GlucoseUnit;
  onSubmit: (data: {
    value: number;
    unit: GlucoseUnit;
    context: ReadingContext;
    timestamp: string;
    note: string | null;
    photoUri: string | null;
    photoChanged: boolean;
  }) => Promise<void>;
  onDelete?: () => void;
  submitLabel: string;
}

export function ReadingForm({ initial, unit, onSubmit, onDelete, submitLabel }: ReadingFormProps) {
  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [context, setContext] = useState<ReadingContext>(initial?.context ?? 'fasting');
  const [note, setNote] = useState(initial?.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photo_uri ?? null);
  const [timestamp, setTimestamp] = useState(() => initial?.timestamp ?? new Date().toISOString());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const numeric = parseFloat(value);
    if (Number.isNaN(numeric) || numeric <= 0) {
      Alert.alert('Invalid value', 'Please enter a valid blood sugar value.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        value: numeric,
        unit: initial?.unit ?? unit,
        context,
        timestamp,
        note: note.trim() || null,
        photoUri,
        photoChanged: photoUri !== (initial?.photo_uri ?? null),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Enter the value shown on your glucose meter.</Text>

      <View style={styles.card}>
        <Field
          label={`Blood sugar (${initial?.unit ?? unit})`}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="e.g. 110"
        />
        <DateTimeField label="Date & time" value={timestamp} onChange={setTimestamp} />
        <ChoicePicker label="Context" choices={READING_CONTEXTS} value={context} onChange={setContext} />
      </View>

      <Text style={styles.optionalLabel}>Optional details</Text>
      <View style={styles.card}>
        <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
        <Field label="Note" value={note} onChangeText={setNote} multiline placeholder="e.g. felt fine" />
      </View>

      <Button title={saving ? 'Saving...' : submitLabel} onPress={handleSubmit} disabled={saving} />

      {onDelete ? (
        <View style={{ marginTop: spacing.md }}>
          <Button title="Delete Reading" variant="danger" onPress={onDelete} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  optionalLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm - 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
});
