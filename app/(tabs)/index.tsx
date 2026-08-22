import { useCallback, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { ReadingCard } from '../../components/ReadingVisuals';
import { Screen } from '../../components/Screen';
import { AppText, Caption, Eyebrow } from '../../components/Typography';
import { listRecentReadings } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import { readingsToLineData, chartMaxValue, convertReadingsToUnit } from '../../lib/chartData';
import { cardShadow, chartHeight, iconSize, radius, spacing } from '../../lib/theme';
import { useAccessibility } from '../../lib/accessibility';
import type { Reading, Profile } from '../../lib/types';

export default function Dashboard() {
  const { colors } = useAccessibility();
  const [recent, setRecent] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listRecentReadings(5), getProfile()])
        .then(([readings, p]) => {
          setRecent(readings);
          setProfile(p);
        })
        .finally(() => setLoaded(true));
    }, [])
  );

  const latest = recent[0] ?? null;
  const targetLow = profile?.target_low ?? 70;
  const targetHigh = profile?.target_high ?? 180;
  const unit = profile?.unit ?? 'mg/dL';
  const chartReadings = convertReadingsToUnit(recent, unit);
  const chartData = readingsToLineData(chartReadings, targetLow, targetHigh);
  // No x-axis labels: several readings often fall on one day, so the axis read
  // "Aug 21, Aug 21, Aug 21" and truncated. The card header states the span, and
  // Trends is where exact dates belong.
  const dashboardChartData = chartData.map((point) => ({ ...point, label: '' }));
  const maxValue = chartMaxValue(
    chartReadings.map((reading) => reading.value),
    targetHigh,
    unit
  );

  return (
    <>
      <Screen scroll style={styles.content}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            accessibilityLabel="SugarTrack"
          />
          <View style={styles.brandText}>
            <AppText variant="title" bold>
              SugarTrack
            </AppText>
            <Caption>Your private health logbook</Caption>
          </View>
        </View>

        <Eyebrow style={styles.eyebrow}>Latest reading</Eyebrow>
        {!loaded ? (
          <View style={[styles.placeholder, { backgroundColor: colors.surfaceMuted }]} />
        ) : latest ? (
          <ReadingCard
            reading={latest}
            targetLow={targetLow}
            targetHigh={targetHigh}
            showRange
            hero
          />
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="water-outline" size={iconSize.xl} color={colors.primary} />
            <AppText variant="bodyLg" bold style={styles.emptyTitle}>
              Ready for your first reading
            </AppText>
            <AppText variant="body" tone="muted" style={styles.emptyText}>
              Add the value from your glucose meter to begin your log.
            </AppText>
            <Button
              title="Add your first reading"
              icon="add"
              onPress={() => router.push('/add-reading')}
              style={styles.emptyButton}
            />
          </View>
        )}

        {loaded && latest ? (
          <Button
            title="Add reading"
            icon="add"
            onPress={() => router.push('/add-reading')}
            style={styles.addButton}
            hint="Record a new blood sugar value"
          />
        ) : null}

        {chartData.length > 1 ? (
          <View
            style={[styles.chartCard, { backgroundColor: colors.surface }]}
            onLayout={(event) => setChartWidth(event.nativeEvent.layout.width - spacing.md * 2)}
          >
            <View style={styles.chartHeader}>
              <AppText variant="body" bold>
                Recent trend
              </AppText>
              <Caption>Last {chartData.length} readings</Caption>
            </View>
            {chartWidth > 0 ? (
              <LineChart
                data={dashboardChartData}
                height={chartHeight.spark}
                width={chartWidth}
                thickness={3}
                color={colors.primary}
                maxValue={maxValue}
                hideRules
                hideYAxisText
                yAxisLabelWidth={0}
                yAxisThickness={0}
                xAxisThickness={0}
                dataPointsRadius={4}
                curved
                adjustToWidth
                initialSpacing={12}
                endSpacing={12}
                showReferenceLine1
                referenceLine1Position={targetHigh}
                referenceLine1Config={{
                  color: colors.high,
                  dashWidth: 4,
                  dashGap: 4,
                  thickness: 1,
                }}
                showReferenceLine2
                referenceLine2Position={targetLow}
                referenceLine2Config={{
                  color: colors.low,
                  dashWidth: 4,
                  dashGap: 4,
                  thickness: 1,
                }}
              />
            ) : null}
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandText: {
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  eyebrow: {
    marginBottom: spacing.sm,
  },
  placeholder: {
    height: 210,
    borderRadius: radius.lg,
  },
  emptyCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...cardShadow,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  addButton: {
    marginTop: spacing.lg,
  },
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
