import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Field } from '../components/Field';
import { ChoicePicker } from '../components/ChoicePicker';
import { Button } from '../components/Button';
import { ScreenTitle } from '../components/Typography';
import { createProfile } from '../lib/db';
import { colors, fontSize, spacing } from '../lib/theme';
import type { GlucoseUnit } from '../lib/types';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [targetLow, setTargetLow] = useState('70');
  const [targetHigh, setTargetHigh] = useState('180');
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL');
  const [doctorName, setDoctorName] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const low = parseFloat(targetLow);
    const high = parseFloat(targetHigh);
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name to continue.');
      return;
    }
    if (Number.isNaN(low) || Number.isNaN(high) || low <= 0 || high <= low) {
      Alert.alert('Invalid target range', 'Please enter a valid low and high target range.');
      return;
    }
    setSaving(true);
    try {
      await createProfile({
        name: name.trim(),
        date_of_birth: dob.trim() || null,
        diabetes_type: 'type2',
        target_low: low,
        target_high: high,
        unit,
        doctor_name: doctorName.trim() || null,
        doctor_contact: doctorContact.trim() || null,
      });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenTitle style={{ marginBottom: spacing.xs }}>Welcome to SugarTrack</ScreenTitle>
      <Text style={styles.subtitle}>Let&apos;s set up your profile.</Text>

      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Mary Smith" />
      <Field label="Date of Birth (optional)" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />

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

      <Button title={saving ? 'Saving...' : 'Get Started'} onPress={handleSave} disabled={saving} />
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
    paddingTop: spacing.xl,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  rangeRow: {
    flexDirection: 'row',
  },
});
