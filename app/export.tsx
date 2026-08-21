import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ChoicePicker } from '../components/ChoicePicker';
import { Button } from '../components/Button';
import { listReadingsInRange, listReadings } from '../lib/readings';
import { getProfile } from '../lib/db';
import {
  prepareReadingsCsv,
  prepareReadingsPdf,
  savePreparedExport,
  sharePreparedExport,
} from '../lib/export';
import type { PreparedExport } from '../lib/export';
import { cardShadow, colors, fontFamily, fontSize, radius, spacing } from '../lib/theme';

type RangeOption = '7' | '30' | '90' | 'all';

const RANGE_CHOICES: { value: RangeOption; label: string }[] = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

export default function ExportScreen() {
  const [range, setRange] = useState<RangeOption>('30');
  const [busy, setBusy] = useState(false);

  const getReadingsForRange = async () => {
    if (range === 'all') return listReadings();
    const days = parseInt(range, 10);
    const start = new Date();
    start.setDate(start.getDate() - days);
    return listReadingsInRange(start.toISOString(), new Date().toISOString());
  };

  const offerShare = (preparedExport: PreparedExport) => {
    Alert.alert('Saved to your device', `${preparedExport.filename} was saved to the folder you selected.`, [
      { text: 'Done', style: 'cancel' },
      {
        text: 'Share now',
        onPress: async () => {
          const isAvailable = await sharePreparedExport(preparedExport);
          if (!isAvailable) {
            Alert.alert('Sharing unavailable', 'This device cannot open the sharing menu.');
          }
        },
      },
    ]);
  };

  const handleExportPdf = async () => {
    setBusy(true);
    try {
      const readings = await getReadingsForRange();
      if (readings.length === 0) {
        Alert.alert('No Data', 'There are no readings in this date range to export.');
        return;
      }
      const profile = await getProfile();
      const preparedExport = await prepareReadingsPdf(readings, profile);
      const savedUri = await savePreparedExport(preparedExport);
      if (savedUri) offerShare(preparedExport);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Could not save the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = async () => {
    setBusy(true);
    try {
      const readings = await getReadingsForRange();
      if (readings.length === 0) {
        Alert.alert('No Data', 'There are no readings in this date range to export.');
        return;
      }
      const preparedExport = prepareReadingsCsv(readings);
      const savedUri = await savePreparedExport(preparedExport);
      if (savedUri) offerShare(preparedExport);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Could not save the CSV. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.introCard}>
        <Text style={styles.title}>A report you control</Text>
        <Text style={styles.subtitle}>
          Choose a folder on your phone. Nothing is uploaded by SugarTrack.
        </Text>
      </View>

      <View style={styles.optionsCard}>
        <ChoicePicker label="Date range" choices={RANGE_CHOICES} value={range} onChange={setRange} />

        <Button title={busy ? 'Preparing…' : 'Save PDF'} onPress={handleExportPdf} disabled={busy} />
        <View style={{ height: spacing.md }} />
        <Button title="Save CSV" variant="secondary" onPress={handleExportCsv} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  introCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.primaryDark,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...cardShadow,
  },
});
