import { useCallback, useState } from 'react';
import { View, Text, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { ChoicePicker } from '../../components/ChoicePicker';
import { listReadingsInRange } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import { readingsToLineData, startOfRange, chartMaxValue, CHART_RANGES } from '../../lib/chartData';
import type { ChartRange } from '../../lib/chartData';
import { colors, fontSize, spacing, radius } from '../../lib/theme';
import type { Reading, Profile } from '../../lib/types';

const screenWidth = Dimensions.get('window').width;

export default function Graph() {
  const [range, setRange] = useState<ChartRange>('week');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const start = startOfRange(range).toISOString();
      const end = new Date().toISOString();
      Promise.all([listReadingsInRange(start, end), getProfile()]).then(([r, p]) => {
        setReadings(r);
        setProfile(p);
        setLoaded(true);
      });
    }, [range])
  );

  const targetLow = profile?.target_low ?? 70;
  const targetHigh = profile?.target_high ?? 180;
  const chartData = readingsToLineData(readings, targetLow, targetHigh);
  const maxValue = chartMaxValue(readings.map((r) => r.value), targetHigh);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Trends</Text>

      <ChoicePicker
        label="Range"
        choices={CHART_RANGES.map((r) => ({ value: r.value, label: r.label }))}
        value={range}
        onChange={setRange}
      />

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.high }]} />
          <Text style={styles.legendText}>High ({targetHigh}+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.inRange }]} />
          <Text style={styles.legendText}>In Range</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.low }]} />
          <Text style={styles.legendText}>Low (&lt;{targetLow})</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        {!loaded ? null : chartData.length > 1 ? (
          <LineChart
            data={chartData}
            height={260}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            thickness={3}
            color={colors.primary}
            maxValue={maxValue}
            hideRules
            yAxisTextStyle={{ color: colors.textMuted, fontSize: fontSize.sm - 4 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: fontSize.sm - 6 }}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            dataPointsRadius={5}
            curved
            initialSpacing={16}
            endSpacing={16}
            spacing={Math.max(28, (screenWidth - 120) / Math.max(chartData.length, 1))}
            showReferenceLine1
            referenceLine1Position={targetHigh}
            referenceLine1Config={{ color: colors.high, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
            showReferenceLine2
            referenceLine2Position={targetLow}
            referenceLine2Config={{ color: colors.low, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
          />
        ) : (
          <Text style={styles.empty}>Not enough readings in this range to show a trend yet.</Text>
        )}
      </View>
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: fontSize.sm - 2,
    color: colors.textMuted,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 260,
    justifyContent: 'center',
  },
  empty: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
