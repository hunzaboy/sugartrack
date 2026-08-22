import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Field } from '../components/Field';
import { ChoicePicker } from '../components/ChoicePicker';
import { DateTimeField } from '../components/DateTimeField';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { AppText, Eyebrow, ScreenTitle } from '../components/Typography';
import { useSnackbar } from '../components/Snackbar';
import { createProfile } from '../lib/db';
import { useAccessibility } from '../lib/accessibility';
import { cardShadow, iconSize, radius, spacing } from '../lib/theme';
import type { GlucoseUnit } from '../lib/types';

/** Typical adult targets, and what the app pre-fills. */
const DEFAULT_TARGETS: Record<GlucoseUnit, { low: string; high: string }> = {
  'mg/dL': { low: '70', high: '180' },
  'mmol/L': { low: '3.9', high: '10.0' },
};

export default function Onboarding() {
  const { colors } = useAccessibility();
  const snackbar = useSnackbar();

  const [name, setName] = useState('');
  const [dob, setDob] = useState<string | null>(null);
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [targetLow, setTargetLow] = useState(DEFAULT_TARGETS['mg/dL'].low);
  const [targetHigh, setTargetHigh] = useState(DEFAULT_TARGETS['mg/dL'].high);
  const [doctorName, setDoctorName] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  /** Switching unit re-seeds the targets, so the numbers always match the unit. */
  const handleUnitChange = (next: GlucoseUnit) => {
    setUnit(next);
    setTargetLow(DEFAULT_TARGETS[next].low);
    setTargetHigh(DEFAULT_TARGETS[next].high);
    setRangeError(null);
  };

  const handleSave = async () => {
    const low = parseFloat(targetLow);
    const high = parseFloat(targetHigh);
    const missingName = !name.trim();
    const badRange = Number.isNaN(low) || Number.isNaN(high) || low <= 0 || high <= low;

    setNameError(missingName ? 'Enter a name so your report can be labelled.' : null);
    setRangeError(badRange ? 'The high target must be greater than the low target.' : null);
    if (missingName || badRange) {
      // Inline errors sit well above the Save button; announce them too so the
      // press never looks like it did nothing.
      snackbar.show(missingName ? 'Enter a name to continue.' : 'Check the highlighted fields above.', { kind: 'error' });
      return;
    }

    setSaving(true);
    try {
      await createProfile({
        name: name.trim(),
        date_of_birth: dob,
        diabetes_type: 'type2',
        target_low: low,
        target_high: high,
        unit,
        doctor_name: doctorName.trim() || null,
        doctor_contact: doctorContact.trim() || null,
      });
      router.replace('/(tabs)');
    } catch {
      snackbar.show('Could not save your profile. Please try again.', { kind: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll style={styles.content}>
      <ScreenTitle style={styles.title}>Welcome to SugarTrack</ScreenTitle>
      <AppText variant="bodyLg" tone="muted" style={styles.subtitle}>
        A private logbook for your blood sugar. Nothing leaves your phone.
      </AppText>

      <Eyebrow style={styles.eyebrow}>About you</Eyebrow>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Field
          label="Name"
          value={name}
          onChangeText={(next) => {
            setName(next);
            if (nameError) setNameError(null);
          }}
          placeholder="e.g. Mary Smith"
          error={nameError}
          help="Used only to label reports you export."
        />
        {/* Was a free-text field expecting you to type "YYYY-MM-DD". */}
        {dob ? (
          <DateTimeField label="Date of birth" value={dob} onChange={setDob} noFuture />
        ) : (
          <Button
            title="Add date of birth (optional)"
            variant="secondary"
            icon="calendar-outline"
            onPress={() => {
              const seed = new Date();
              seed.setFullYear(seed.getFullYear() - 60);
              setDob(seed.toISOString());
            }}
            style={styles.dobButton}
          />
        )}
      </View>

      <Eyebrow style={styles.eyebrow}>Your target range</Eyebrow>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.explainer, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="information-circle-outline" size={iconSize.md} color={colors.primaryDark} />
          <AppText variant="body" style={[styles.flex, { color: colors.primaryDark }]}>
            SugarTrack marks each reading low, in range, or high using these numbers. Your doctor can
            tell you the right range for you — the defaults are typical starting points.
          </AppText>
        </View>

        <ChoicePicker
          label="Blood sugar unit"
          choices={[
            { value: 'mg/dL', label: 'mg/dL' },
            { value: 'mmol/L', label: 'mmol/L' },
          ]}
          value={unit}
          onChange={handleUnitChange}
        />

        <View style={styles.rangeRow}>
          <View style={styles.flex}>
            <Field
              label="Target low"
              value={targetLow}
              onChangeText={(next) => {
                setTargetLow(next);
                if (rangeError) setRangeError(null);
              }}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex}>
            <Field
              label="Target high"
              value={targetHigh}
              onChangeText={(next) => {
                setTargetHigh(next);
                if (rangeError) setRangeError(null);
              }}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        {rangeError ? (
          <View style={styles.rangeError} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={iconSize.sm} color={colors.danger} />
            <AppText variant="caption" tone="danger" style={styles.flex}>
              {rangeError}
            </AppText>
          </View>
        ) : null}
      </View>

      <Eyebrow style={styles.eyebrow}>Your doctor (optional)</Eyebrow>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Field label="Doctor name" value={doctorName} onChangeText={setDoctorName} />
        <Field
          label="Doctor contact"
          value={doctorContact}
          onChangeText={setDoctorContact}
          help="Appears on the report you export."
        />
      </View>

      <Button title="Get started" onPress={handleSave} loading={saving} icon="arrow-forward" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  explainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rangeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dobButton: {
    marginBottom: spacing.md,
  },
});
