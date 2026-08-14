import { useState } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { Field } from './Field';
import { ChoicePicker } from './ChoicePicker';
import { Button } from './Button';
import { PhotoPicker } from './PhotoPicker';
import { spacing } from '../lib/theme';
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
        timestamp: initial?.timestamp ?? new Date().toISOString(),
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
      <Field
        label={`Blood Sugar (${initial?.unit ?? unit})`}
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
        placeholder="e.g. 110"
      />
      <ChoicePicker label="Context" choices={READING_CONTEXTS} value={context} onChange={setContext} />
      <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
      <Field label="Note (optional)" value={note} onChangeText={setNote} multiline placeholder="e.g. felt fine" />

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
  },
  content: {
    padding: spacing.lg,
  },
});
