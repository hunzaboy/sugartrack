import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ChoicePicker } from '../components/ChoicePicker';
import { Button } from '../components/Button';
import { listReadingsInRange, listReadings } from '../lib/readings';
import { getProfile } from '../lib/db';
import { exportReadingsCsv, exportReadingsPdf } from '../lib/export';
import { colors, fontSize, spacing } from '../lib/theme';

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

  const handleExportPdf = async () => {
    setBusy(true);
    try {
      const readings = await getReadingsForRange();
      if (readings.length === 0) {
        Alert.alert('No Data', 'There are no readings in this date range to export.');
        return;
      }
      const profile = await getProfile();
      await exportReadingsPdf(readings, profile);
    } catch {
      Alert.alert('Export Failed', 'Could not generate the PDF. Please try again.');
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
      await exportReadingsCsv(readings);
    } catch {
      Alert.alert('Export Failed', 'Could not generate the CSV. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.subtitle}>
        Generate a report of your blood sugar readings to bring to your next doctor visit.
      </Text>

      <ChoicePicker label="Date Range" choices={RANGE_CHOICES} value={range} onChange={setRange} />

      <Button title="Export as PDF" onPress={handleExportPdf} disabled={busy} />
      <View style={{ height: spacing.md }} />
      <Button title="Export as CSV" variant="secondary" onPress={handleExportCsv} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
});
