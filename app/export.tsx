import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoicePicker } from '../components/ChoicePicker';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { AppText } from '../components/Typography';
import { useSnackbar } from '../components/Snackbar';
import { listReadingsInRange, listReadings } from '../lib/readings';
import { getProfile } from '../lib/db';
import { prepareReadingsPdf } from '../lib/export';
import { useExportDelivery } from '../lib/useExportDelivery';
import { useAccessibility } from '../lib/accessibility';
import { cardShadow, iconSize, radius, spacing } from '../lib/theme';

type RangeOption = '7' | '30' | '90' | 'all';

const RANGE_CHOICES: { value: RangeOption; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export default function ExportScreen() {
  const { colors } = useAccessibility();
  const snackbar = useSnackbar();
  const { deliver } = useExportDelivery();
  const [range, setRange] = useState<RangeOption>('30');
  const [busy, setBusy] = useState(false);

  const getReadingsForRange = async () => {
    if (range === 'all') return listReadings();
    const days = parseInt(range, 10);
    const start = new Date();
    start.setDate(start.getDate() - days);
    return listReadingsInRange(start.toISOString(), new Date().toISOString());
  };

  const run = async () => {
    setBusy(true);
    try {
      const readings = await getReadingsForRange();
      if (readings.length === 0) {
        snackbar.show('There are no readings in this date range.', { kind: 'error' });
        return;
      }
      const prepared = await prepareReadingsPdf(readings, await getProfile());
      await deliver(prepared, 'PDF report');
    } catch (error) {
      snackbar.show(
        error instanceof Error ? error.message : 'Could not save the file. Please try again.',
        { kind: 'error' }
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll header style={styles.content}>
      <View style={[styles.introCard, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="lock-closed-outline" size={iconSize.lg} color={colors.primaryDark} />
        <AppText variant="title" bold style={[styles.title, { color: colors.primaryDark }]}>
          A report you control
        </AppText>
        <AppText variant="body" tone="muted">
          Choose a folder on your phone. Nothing is uploaded by SugarTrack.
        </AppText>
      </View>

      <View style={[styles.optionsCard, { backgroundColor: colors.surface }]}>
        <ChoicePicker label="Date range" choices={RANGE_CHOICES} value={range} onChange={setRange} />

        {/* One export, not two. The CSV was a second path to maintain for a
            file most people could not open on a phone, while the report the
            doctor actually reads is the PDF. */}
        <Button
          title="Save PDF report"
          icon="document-text-outline"
          onPress={run}
          loading={busy}
          disabled={busy}
          hint="Grouped by day, ready to show or email to your doctor"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  introCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  optionsCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    ...cardShadow,
  },
});
