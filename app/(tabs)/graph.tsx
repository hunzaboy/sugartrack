import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { ChoicePicker } from '../../components/ChoicePicker';
import { Screen } from '../../components/Screen';
import { ScreenTitle } from '../../components/Typography';
import { listReadingsInRange } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import {
  readingsToDailyLineData,
  readingsToLineData,
  startOfRange,
  chartMaxValue,
  convertReadingsToUnit,
  CHART_RANGES,
} from '../../lib/chartData';
import type { ChartDataPoint, ChartRange } from '../../lib/chartData';
import { READING_CONTEXTS } from '../../lib/types';
import { colors, fontFamily, fontSize, spacing, radius, cardShadow } from '../../lib/theme';
import type { Reading, Profile } from '../../lib/types';

type TrendMode = 'daily' | 'readings';

const TREND_MODES: { value: TrendMode; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'readings', label: 'All readings' },
];

function pointDetailLabel(point: ChartDataPoint): string {
  if (point.context === 'Daily average') {
    return `${point.readingCount} reading${point.readingCount === 1 ? '' : 's'}`;
  }
  return READING_CONTEXTS.find((context) => context.value === point.context)?.label ?? point.context;
}

export default function Graph() {
  const [range, setRange] = useState<ChartRange>('week');
  const [mode, setMode] = useState<TrendMode>('daily');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chartCardWidth, setChartCardWidth] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoaded(false);
      setSelectedPoint(null);
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
  const unit = profile?.unit ?? 'mg/dL';
  const normalizedReadings = convertReadingsToUnit(readings, unit);
  const chartData =
    mode === 'daily'
      ? readingsToDailyLineData(normalizedReadings, targetLow, targetHigh)
      : readingsToLineData(normalizedReadings, targetLow, targetHigh, true);
  const labelEvery = Math.max(1, Math.ceil(chartData.length / (mode === 'daily' ? 7 : 5)));
  const interactiveChartData = chartData.map((point, index) => ({
    ...point,
    label: index % labelEvery === 0 || index === chartData.length - 1 ? point.label : '',
    labelTextStyle:
      mode === 'daily'
        ? {
            color: colors.textMuted,
            fontSize: fontSize.sm - 6,
            width: 64,
            textAlign: 'center' as const,
            transform: [
              {
                translateX: index === 0 ? 18 : index === chartData.length - 1 ? -42 : 0,
              },
            ],
          }
        : undefined,
    onPress: () => setSelectedPoint(point),
  }));
  const maxValue = chartMaxValue(
    normalizedReadings.map((reading) => reading.value),
    targetHigh,
    unit
  );
  const yAxisLabelWidth = unit === 'mmol/L' ? 34 : 42;
  const chartWidth = Math.max(chartCardWidth - spacing.md * 2 - yAxisLabelWidth, 0);

  return (
    <Screen scroll style={styles.content}>
      <ScreenTitle style={{ marginBottom: spacing.md }}>Trends</ScreenTitle>

      <ChoicePicker
        label="View"
        choices={TREND_MODES}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setSelectedPoint(null);
        }}
      />

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

      <View
        style={styles.chartCard}
        onLayout={(event) => setChartCardWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>{mode === 'daily' ? 'Daily averages' : 'Every reading'}</Text>
            <Text style={styles.chartSubtitle}>
              {chartData.length} {mode === 'daily' ? 'day' : 'reading'}
              {chartData.length === 1 ? '' : 's'} · {unit}
            </Text>
          </View>
          <Text style={styles.tapHint}>Tap a point</Text>
        </View>
        {!loaded || chartWidth === 0 ? null : chartData.length > 0 ? (
          <LineChart
            data={interactiveChartData}
            height={260}
            width={chartWidth}
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
            adjustToWidth={mode === 'daily'}
            disableScroll={mode === 'daily'}
            initialSpacing={28}
            endSpacing={32}
            spacing={mode === 'readings' ? 52 : undefined}
            yAxisLabelWidth={yAxisLabelWidth}
            showFractionalValues={unit === 'mmol/L'}
            roundToDigits={unit === 'mmol/L' ? 1 : 0}
            formatYLabel={(label) => (unit === 'mmol/L' ? Number(label).toFixed(1) : String(Math.round(Number(label))))}
            showReferenceLine1
            referenceLine1Position={targetHigh}
            referenceLine1Config={{ color: colors.high, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
            showReferenceLine2
            referenceLine2Position={targetLow}
            referenceLine2Config={{ color: colors.low, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
          />
        ) : (
          <Text style={styles.empty}>No readings in this range yet.</Text>
        )}
      </View>

      {selectedPoint ? (
        <View style={styles.detailCard}>
          <View>
            <Text style={styles.detailDate}>
              {mode === 'daily'
                ? new Date(selectedPoint.timestamp).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : new Date(selectedPoint.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.detailContext}>{pointDetailLabel(selectedPoint)}</Text>
          </View>
          <View style={styles.detailValueRow}>
            <Text style={styles.detailValue}>{selectedPoint.value}</Text>
            <Text style={styles.detailUnit}>{unit}</Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
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
    overflow: 'hidden',
    ...cardShadow,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  chartTitle: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  chartSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm - 4,
    marginTop: 2,
  },
  tapHint: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm - 4,
  },
  empty: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  detailDate: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  detailContext: {
    color: colors.textMuted,
    fontSize: fontSize.sm - 3,
    marginTop: 2,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  detailValue: {
    color: colors.primaryDark,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  detailUnit: {
    color: colors.textMuted,
    fontSize: fontSize.sm - 3,
  },
});
