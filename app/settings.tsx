import { useCallback, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Field } from '../components/Field';
import { ChoicePicker } from '../components/ChoicePicker';
import { Button } from '../components/Button';
import { DateTimeField } from '../components/DateTimeField';
import { Screen } from '../components/Screen';
import { SwitchRow } from '../components/SettingsRow';
import { AppText, Caption, SectionTitle } from '../components/Typography';
import { useSnackbar } from '../components/Snackbar';
import { getProfile, updateProfile } from '../lib/db';
import { prepareBackup, importBackup } from '../lib/backup';
import { useExportDelivery } from '../lib/useExportDelivery';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../lib/notifications';
import { useAccessibility } from '../lib/accessibility';
import { formatDayLabel, formatStorageTime, fromStorageTime, toStorageTime } from '../lib/datetime';
import { cardShadow, iconSize, radius, spacing } from '../lib/theme';
import type { Profile, GlucoseUnit } from '../lib/types';

const DAYS_UNTIL_BACKUP_REMINDER = 30;

export default function SettingsScreen() {
  const { largeText, setLargeText, colors } = useAccessibility();
  const snackbar = useSnackbar();
  const { deliver } = useExportDelivery();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [targetLow, setTargetLow] = useState('');
  const [targetHigh, setTargetHigh] = useState('');
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [doctorName, setDoctorName] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [nameError, setNameError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const load = useCallback(() => {
    return getProfile().then((p) => {
      if (!p) return;
      setProfile(p);
      setName(p.name ?? '');
      setTargetLow(String(p.target_low));
      setTargetHigh(String(p.target_high));
      setUnit(p.unit);
      setDoctorName(p.doctor_name ?? '');
      setDoctorContact(p.doctor_contact ?? '');
      setReminderEnabled(!!p.reminder_enabled);
      setReminderTime(p.reminder_time ?? '08:00');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const daysSinceBackup = profile?.last_backup_at
    ? Math.floor((Date.now() - new Date(profile.last_backup_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showBackupReminder = daysSinceBackup === null || daysSinceBackup >= DAYS_UNTIL_BACKUP_REMINDER;

  const handleSaveProfile = async () => {
    const low = parseFloat(targetLow);
    const high = parseFloat(targetHigh);
    const missingName = !name.trim();
    const badRange = Number.isNaN(low) || Number.isNaN(high) || low <= 0 || high <= low;

    setNameError(missingName ? 'Enter a name for your log.' : null);
    setRangeError(badRange ? 'The high target must be greater than the low target.' : null);
    if (missingName || badRange) {
      // Inline errors sit well above the Save button; announce them too so the
      // press never looks like it did nothing.
      snackbar.show(missingName ? 'Enter a name to continue.' : 'Check the highlighted fields above.', { kind: 'error' });
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        target_low: low,
        target_high: high,
        unit,
        doctor_name: doctorName.trim() || null,
        doctor_contact: doctorContact.trim() || null,
      });
      await load();
      snackbar.show('Profile saved.', { kind: 'success' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        snackbar.show('Allow notifications for SugarTrack in your phone settings to use reminders.', {
          kind: 'error',
        });
        return;
      }
      await scheduleDailyReminder(reminderTime);
    } else {
      await cancelDailyReminder();
    }
    setReminderEnabled(value);
    await updateProfile({ reminder_enabled: value ? 1 : 0 });
  };

  /** Receives an ISO string from the native time picker; we store "HH:MM". */
  const handleReminderTimeChange = async (iso: string) => {
    const time = toStorageTime(new Date(iso));
    setReminderTime(time);
    await updateProfile({ reminder_time: time });
    if (reminderEnabled) await scheduleDailyReminder(time);
  };

  const handleToggleLargeText = async (value: boolean) => {
    setLargeText(value);
    await updateProfile({ large_text: value ? 1 : 0 });
  };

  const handleExportBackup = async () => {
    setBackupBusy(true);
    try {
      const prepared = await prepareBackup();
      const saved = await deliver(prepared, 'Backup');
      if (!saved) return;
      await updateProfile({ last_backup_at: new Date().toISOString() });
      await load();
    } catch {
      snackbar.show('Could not save a backup. Please try again.', { kind: 'error' });
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/zip',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    // Destructive and irreversible — this is what Alert is still for.
    Alert.alert(
      'Replace all your data?',
      'This replaces every reading, photo and setting with the contents of this backup. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            setBackupBusy(true);
            try {
              await importBackup(result.assets[0].uri);
              await load();
              snackbar.show('Backup restored.', { kind: 'success' });
            } catch (e) {
              snackbar.show(
                e instanceof Error ? e.message : 'Could not restore this backup file.',
                { kind: 'error' }
              );
            } finally {
              setBackupBusy(false);
            }
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const card = [styles.card, { backgroundColor: colors.surface }];

  return (
    <Screen scroll header style={styles.content}>
      <SectionTitle style={styles.firstTitle}>Profile</SectionTitle>
      <View style={card}>
        <Field
          label="Name"
          value={name}
          onChangeText={(next) => {
            setName(next);
            if (nameError) setNameError(null);
          }}
          error={nameError}
        />
        <ChoicePicker
          label="Blood sugar unit"
          choices={[
            { value: 'mg/dL', label: 'mg/dL' },
            { value: 'mmol/L', label: 'mmol/L' },
          ]}
          value={unit}
          onChange={setUnit}
        />
        <View style={styles.rangeRow}>
          <View style={styles.rangeCell}>
            <Field
              label="Target low"
              value={targetLow}
              onChangeText={(next) => {
                setTargetLow(next);
                if (rangeError) setRangeError(null);
              }}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rangeCell}>
            <Field
              label="Target high"
              value={targetHigh}
              onChangeText={(next) => {
                setTargetHigh(next);
                if (rangeError) setRangeError(null);
              }}
              keyboardType="number-pad"
            />
          </View>
        </View>
        {rangeError ? (
          <View style={styles.rangeError} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={iconSize.sm} color={colors.danger} />
            <Caption tone="danger" style={styles.flex}>
              {rangeError}
            </Caption>
          </View>
        ) : null}
        <Field label="Doctor name (optional)" value={doctorName} onChangeText={setDoctorName} />
        <Field
          label="Doctor contact (optional)"
          value={doctorContact}
          onChangeText={setDoctorContact}
        />
        <Button title="Save profile" onPress={handleSaveProfile} loading={savingProfile} icon="checkmark" />
      </View>

      <SectionTitle>Accessibility</SectionTitle>
      <View style={card}>
        {/* One control, one job. This used to be labelled "Large Text & High
            Contrast", conflating two separate things the user might want. */}
        <SwitchRow
          label="Bigger, bolder text"
          description="Increases text size across the app and darkens colours for easier reading."
          value={largeText}
          onValueChange={handleToggleLargeText}
        />
        <Caption style={styles.helper}>
          Your phone&apos;s own text size setting also applies. This adds to it.
        </Caption>
      </View>

      <SectionTitle>Reminders</SectionTitle>
      <View style={card}>
        <SwitchRow
          label="Daily testing reminder"
          description={reminderEnabled ? `Every day at ${formatStorageTime(reminderTime)}` : undefined}
          value={reminderEnabled}
          onValueChange={handleToggleReminder}
        />
        {reminderEnabled ? (
          <View style={styles.reminderTime}>
            {/* Was a free-text field expecting 24-hour "08:00". */}
            <DateTimeField
              label="Reminder time"
              mode="time"
              value={fromStorageTime(reminderTime).toISOString()}
              onChange={handleReminderTimeChange}
            />
          </View>
        ) : null}
        <Caption style={styles.helper}>
          Reminders can be delayed by your phone&apos;s battery saver. For reliable reminders, exclude
          SugarTrack from battery restrictions.
        </Caption>
      </View>

      <SectionTitle>Backup and restore</SectionTitle>
      <View style={card}>
        {showBackupReminder ? (
          <View style={[styles.banner, { backgroundColor: colors.lowBg }]}>
            <Ionicons name="warning-outline" size={iconSize.md} color={colors.low} />
            <AppText variant="body" bold style={[styles.flex, { color: colors.low }]}>
              {daysSinceBackup === null
                ? "You haven't made a backup yet. Back up now in case you change phones."
                : `It has been ${daysSinceBackup} days since your last backup.`}
            </AppText>
          </View>
        ) : (
          <Caption style={styles.helper}>
            Last backup: {formatDayLabel(profile.last_backup_at as string)}
          </Caption>
        )}
        <Caption style={styles.helper}>
          Choose a folder on your phone. Nothing is uploaded. You can share the file afterwards if you
          want to.
        </Caption>
        <Button
          title="Save backup"
          onPress={handleExportBackup}
          loading={backupBusy}
          icon="save-outline"
        />
        <View style={styles.gap} />
        <Button
          title="Restore from backup"
          variant="secondary"
          onPress={handleImportBackup}
          disabled={backupBusy}
          icon="folder-open-outline"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  firstTitle: {
    marginTop: 0,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...cardShadow,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rangeCell: {
    flex: 1,
  },
  rangeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  helper: {
    marginBottom: spacing.md,
  },
  reminderTime: {
    marginTop: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  gap: {
    height: spacing.md,
  },
});
