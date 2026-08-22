import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Field } from './Field';
import { ChoicePicker } from './ChoicePicker';
import { Button } from './Button';
import { PhotoPicker } from './PhotoPicker';
import { DateTimeField } from './DateTimeField';
import { AppText, Eyebrow } from './Typography';
import { useSnackbar } from './Snackbar';
import { cardShadow, radius, spacing, iconSize, touchTarget } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { tapFeedback } from '../lib/haptics';
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

/**
 * Plausible meter ranges. Outside these we refuse the value rather than store it —
 * a mistyped 1100 for 110 used to save silently, which is worse than an error in a
 * log someone may show a doctor.
 */
const LIMITS: Record<GlucoseUnit, { min: number; max: number; example: string }> = {
  'mg/dL': { min: 20, max: 600, example: '110' },
  'mmol/L': { min: 1.1, max: 33.3, example: '6.1' },
};

export function ReadingForm({ initial, unit, onSubmit, onDelete, submitLabel }: ReadingFormProps) {
  const { colors, scale } = useAccessibility();
  const snackbar = useSnackbar();
  const scroller = useRef<ScrollView>(null);
  const activeUnit = initial?.unit ?? unit;
  const limits = LIMITS[activeUnit];

  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [context, setContext] = useState<ReadingContext>(initial?.context ?? 'fasting');
  const [note, setNote] = useState(initial?.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photo_uri ?? null);
  const [timestamp, setTimestamp] = useState(() => initial?.timestamp ?? new Date().toISOString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (message: string): null => {
    setError(message);
    // The Save button is at the bottom of the form, so the value field — and its
    // error — is usually scrolled out of sight by the time you press Save. Bring
    // it back into view and announce it, or the tap looks like it did nothing.
    scroller.current?.scrollTo({ y: 0, animated: true });
    snackbar.show(message, { kind: 'error' });
    return null;
  };

  const validate = (): number | null => {
    const numeric = parseFloat(value.replace(',', '.'));
    if (!value.trim()) return fail('Enter the value from your meter.');
    if (Number.isNaN(numeric)) return fail('That is not a number. Enter digits only.');
    if (numeric < limits.min || numeric > limits.max) {
      return fail(
        `A ${activeUnit} reading is normally between ${limits.min} and ${limits.max}. Please check the value.`
      );
    }
    setError(null);
    return numeric;
  };

  const handleSubmit = async () => {
    const numeric = validate();
    if (numeric === null) {
      // `fail` already reported; snackbar supplies its own warning haptic.
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        value: numeric,
        unit: activeUnit,
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scroller}
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="body" tone="muted" style={styles.intro}>
          Enter the value shown on your glucose meter.
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Field
            label={`Blood sugar (${activeUnit})`}
            value={value}
            onChangeText={(next) => {
              setValue(next);
              if (error) setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder={`e.g. ${limits.example}`}
            error={error}
            autoFocus={!initial}
            returnKeyType="done"
            maxLength={6}
          />
          <DateTimeField label="Date and time" value={timestamp} onChange={setTimestamp} noFuture />
          <ChoicePicker
            label="Context"
            choices={READING_CONTEXTS}
            value={context}
            onChange={setContext}
          />
        </View>

        <Eyebrow style={styles.optionalLabel}>Optional details</Eyebrow>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
          <Field
            label="Note"
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="e.g. felt fine"
          />
        </View>

        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={saving}
          icon="checkmark"
          hint="Saves this reading to your log"
        />

        {onDelete ? (
          // Deliberately low-emphasis and pushed well clear of Save. It used to be a
          // full-width solid red button immediately below the primary action.
          <View style={[styles.dangerZone, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={() => {
                tapFeedback();
                onDelete();
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete this reading"
              android_ripple={{ color: colors.surfaceRipple }}
              style={({ pressed }) => [
                styles.deleteRow,
                { minHeight: touchTarget.minHeight * Math.max(scale, 1) },
                pressed && { backgroundColor: colors.dangerSoft },
              ]}
            >
              <Ionicons name="trash-outline" size={iconSize.md} color={colors.danger} />
              <AppText variant="body" bold tone="danger">
                Delete this reading
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    marginBottom: spacing.md,
  },
  optionalLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  dangerZone: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
