import { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { Button } from '../../components/Button';
import { ReadingCard } from '../../components/ReadingVisuals';
import { Screen } from '../../components/Screen';
import { listRecentReadings } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import { readingsToLineData, chartMaxValue, convertReadingsToUnit } from '../../lib/chartData';
import { colors, fontFamily, fontSize, spacing, radius, cardShadow } from '../../lib/theme';
import type { Reading, Profile } from '../../lib/types';

export default function Dashboard() {
  const [recent, setRecent] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listRecentReadings(10), getProfile()]).then(([readings, p]) => {
        setRecent(readings);
        setProfile(p);
        setLoaded(true);
      });
    }, [])
  );

  const latest = recent[0] ?? null;
  const targetLow = profile?.target_low ?? 70;
  const targetHigh = profile?.target_high ?? 180;
  const chartReadings = convertReadingsToUnit(recent, profile?.unit ?? 'mg/dL');
  const chartData = readingsToLineData(chartReadings, targetLow, targetHigh);
  const dashboardChartData = chartData.map((point, index) => ({
    ...point,
    label: index > 0 && index < chartData.length - 1 ? point.label : '',
  }));
  const maxValue = chartMaxValue(
    chartReadings.map((reading) => reading.value),
    targetHigh,
    profile?.unit ?? 'mg/dL'
  );

  return (
    <Screen scroll style={styles.content}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <View>
          <Text style={styles.brandName}>SugarTrack</Text>
          <Text style={styles.brandTagline}>Your private health logbook</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Latest reading</Text>
      {!loaded ? null : latest ? (
        <ReadingCard
          reading={latest}
          targetLow={targetLow}
          targetHigh={targetHigh}
          showRange
          hero
        />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Ready for your first reading</Text>
          <Text style={styles.emptyText}>Add a value from your glucose meter to begin your log.</Text>
        </View>
      )}

      {chartData.length > 1 ? (
        <View
          style={styles.chartCard}
          onLayout={(event) => setChartWidth(event.nativeEvent.layout.width - spacing.md * 2)}
        >
          <View style={styles.chartHeader}>
            <Text style={styles.chartLabel}>Recent trend</Text>
            <Text style={styles.chartCaption}>Last {chartData.length} readings</Text>
          </View>
          {chartWidth > 0 ? (
            <LineChart
              data={dashboardChartData}
              height={112}
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
              endSpacing={8}
              showReferenceLine1
              referenceLine1Position={targetHigh}
              referenceLine1Config={{ color: colors.high, dashWidth: 4, dashGap: 4, thickness: 1 }}
              showReferenceLine2
              referenceLine2Position={targetLow}
              referenceLine2Config={{ color: colors.low, dashWidth: 4, dashGap: 4, thickness: 1 }}
            />
          ) : null}
        </View>
      ) : null}

      <Button
        title="+ Add reading"
        onPress={() => router.push('/add-reading')}
        style={styles.addButton}
      />
    </Screen>
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
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  brandName: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  brandTagline: {
    color: colors.textMuted,
    fontSize: fontSize.sm - 3,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm - 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...cardShadow,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  addButton: {
    marginTop: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  chartLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chartCaption: {
    fontSize: fontSize.sm - 4,
    color: colors.textMuted,
  },
});
