import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Field } from '../components/Field';
import { ChoicePicker } from '../components/ChoicePicker';
import { Button } from '../components/Button';
import { getProfile, updateProfile } from '../lib/db';
import { exportBackup, importBackup } from '../lib/backup';
import { requestNotificationPermission, scheduleDailyReminder, cancelDailyReminder } from '../lib/notifications';
import { useAccessibility } from '../lib/accessibility';
import { colors, fontSize, spacing, radius } from '../lib/theme';
import type { Profile, GlucoseUnit } from '../lib/types';

const DAYS_UNTIL_BACKUP_REMINDER = 30;

export default function SettingsScreen() {
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
  const { largeText, setLargeText } = useAccessibility();

  const load = useCallback(() => {
    getProfile().then((p) => {
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
    const low = parseInt(targetLow, 10);
    const high = parseInt(targetHigh, 10);
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    if (Number.isNaN(low) || Number.isNaN(high) || low <= 0 || high <= low) {
      Alert.alert('Invalid target range', 'Please enter a valid low and high target range.');
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
      load();
      Alert.alert('Saved', 'Your profile has been updated.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please allow notifications for SugarTrack in your device settings to use reminders.'
        );
        return;
      }
      await scheduleDailyReminder(reminderTime);
    } else {
      await cancelDailyReminder();
    }
    setReminderEnabled(value);
    await updateProfile({ reminder_enabled: value ? 1 : 0 });
  };

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      await updateProfile({ reminder_time: time });
      if (reminderEnabled) {
        await scheduleDailyReminder(time);
      }
    }
  };

  const handleToggleLargeText = async (value: boolean) => {
    setLargeText(value);
    await updateProfile({ large_text: value ? 1 : 0 });
  };

  const handleExportBackup = async () => {
    setBackupBusy(true);
    try {
      await exportBackup();
      load();
    } catch {
      Alert.alert('Backup Failed', 'Could not create a backup. Please try again.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/zip', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;

    Alert.alert(
      'Restore Backup',
      'This will replace all current readings, photos, and settings with the contents of this backup. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBackupBusy(true);
            try {
              await importBackup(result.assets[0].uri);
              load();
              Alert.alert('Restore Complete', 'Your backup has been restored.');
            } catch (e) {
              Alert.alert('Restore Failed', e instanceof Error ? e.message : 'Could not restore this backup file.');
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Field label="Name" value={name} onChangeText={setName} />
      <ChoicePicker
        label="Blood Sugar Unit"
        choices={[
          { value: 'mg/dL', label: 'mg/dL' },
          { value: 'mmol/L', label: 'mmol/L' },
        ]}
        value={unit}
        onChange={setUnit}
      />
      <View style={styles.rangeRow}>
        <View style={{ flex: 1 }}>
          <Field label="Target Low" value={targetLow} onChangeText={setTargetLow} keyboardType="number-pad" />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Field label="Target High" value={targetHigh} onChangeText={setTargetHigh} keyboardType="number-pad" />
        </View>
      </View>
      <Field label="Doctor Name (optional)" value={doctorName} onChangeText={setDoctorName} />
      <Field label="Doctor Contact (optional)" value={doctorContact} onChangeText={setDoctorContact} />
      <Button title={savingProfile ? 'Saving...' : 'Save Profile'} onPress={handleSaveProfile} disabled={savingProfile} />

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Accessibility</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Large Text & High Contrast</Text>
        <Switch value={largeText} onValueChange={handleToggleLargeText} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Reminders</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Daily Testing Reminder</Text>
        <Switch value={reminderEnabled} onValueChange={handleToggleReminder} />
      </View>
      {reminderEnabled ? (
        <Field
          label="Reminder Time (24-hour, e.g. 08:00)"
          value={reminderTime}
          onChangeText={handleReminderTimeChange}
          placeholder="08:00"
        />
      ) : null}
      <Text style={styles.helperText}>
        Note: reminders may be delayed by your device's battery optimization settings. For best results,
        exclude SugarTrack from battery restrictions.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Backup & Restore</Text>
      {showBackupReminder ? (
        <View style={styles.reminderBanner}>
          <Text style={styles.reminderText}>
            {daysSinceBackup === null
              ? "You haven't made a backup yet. Back up your data in case you change phones."
              : `It's been ${daysSinceBackup} days since your last backup. Consider backing up again.`}
          </Text>
        </View>
      ) : (
        <Text style={styles.lastBackupText}>
          Last backup: {profile.last_backup_at ? new Date(profile.last_backup_at).toLocaleString() : 'never'}
        </Text>
      )}
      <Button
        title={backupBusy ? 'Working...' : 'Export Backup'}
        onPress={handleExportBackup}
        disabled={backupBusy}
      />
      <View style={{ height: spacing.md }} />
      <Button
        title="Restore from Backup"
        variant="secondary"
        onPress={handleImportBackup}
        disabled={backupBusy}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  rangeRow: { flexDirection: 'row' },
  reminderBanner: {
    backgroundColor: colors.lowBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reminderText: {
    color: colors.low,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  lastBackupText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    marginBottom: spacing.sm,
  },
  switchLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  helperText: {
    fontSize: fontSize.sm - 2,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
