import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { ChoicePicker } from '../../components/ChoicePicker';
import { Screen } from '../../components/Screen';
import { AppText, Caption, ScreenTitle } from '../../components/Typography';
import { listReadingsInRange } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import {
  readingsToDailyLineData,
  readingsToLineData,
  startOfRange,
  chartMaxValue,
  chartMinValue,
  convertReadingsToUnit,
  rangeStats,
  CHART_RANGES,
} from '../../lib/chartData';
import type { ChartDataPoint, ChartRange } from '../../lib/chartData';
import { cardShadow, chartHeight, fontSize, radius, spacing } from '../../lib/theme';
import { useAccessibility } from '../../lib/accessibility';
import type { Reading, Profile } from '../../lib/types';

type TrendMode = 'daily' | 'readings';

const TREND_MODES: { value: TrendMode; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'readings', label: 'All readings' },
];

export default function Graph() {
  const { colors, scale } = useAccessibility();
  const [range, setRange] = useState<ChartRange>('week');
  const [mode, setMode] = useState<TrendMode>('daily');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chartCardWidth, setChartCardWidth] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setLoaded(false);
      setFailed(false);
      const start = startOfRange(range).toISOString();
      const end = new Date().toISOString();
      Promise.all([listReadingsInRange(start, end), getProfile()])
        .then(([r, p]) => {
          setReadings(r);
          setProfile(p);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoaded(true));
    }, [range])
  );

  const targetLow = profile?.target_low ?? 70;
  const targetHigh = profile?.target_high ?? 180;
  const unit = profile?.unit ?? 'mg/dL';
  const normalizedReadings = convertReadingsToUnit(readings, unit);
  const stats = rangeStats(normalizedReadings, targetLow, targetHigh);
  const decimals = unit === 'mmol/L' ? 1 : 0;

  const chartData =
    mode === 'daily'
      ? readingsToDailyLineData(
          normalizedReadings,
          targetLow,
          targetHigh,
          range === 'day' || range === 'week' ? 'weekday' : 'date'
        )
      : readingsToLineData(normalizedReadings, targetLow, targetHigh, true);

  // gifted-charts sizes each label slot from `spacing`, which truncated labels
  // mid-word ("Sat" -> "Sa"). An explicit width per label gives every one the
  // same room and keeps them centred on their point.
  const labelWidth = Math.round(72 * Math.max(scale, 1));
  const labelEvery = Math.max(1, Math.ceil(chartData.length / (mode === 'daily' ? 7 : 5)));
  const labeledChartData = chartData.map((point, index) => ({
    ...point,
    label: index % labelEvery === 0 || index === chartData.length - 1 ? point.label : '',
    labelTextStyle: {
      color: colors.textMuted,
      fontSize: fontSize.caption * scale,
      width: labelWidth,
      textAlign: 'center' as const,
    },
  }));

  const values = normalizedReadings.map((reading) => reading.value);
  const maxValue = chartMaxValue(values, targetHigh, unit);
  const minValue = chartMinValue(values, targetLow, unit);
  // Axis text now respects the in-app scale, so the gutter has to grow with it.
  const axisFontSize = fontSize.caption * scale;
  const yAxisLabelWidth = Math.ceil((unit === 'mmol/L' ? 34 : 42) * scale);
  // `adjustToWidth` overrides endSpacing, so the final x-axis label is centred on
  // the last point and half of it lands outside the card. Reserving half a label
  // keeps the rest from being truncated mid-word; the very last one may still be
  // dropped by the library, which is acceptable — the tooltip gives exact values.
  const lastLabelOverhang = Math.ceil(labelWidth / 2);
  const chartWidth = Math.max(
    chartCardWidth - spacing.md * 2 - yAxisLabelWidth - lastLabelOverhang,
    0
  );

  return (
    <Screen scroll style={styles.content}>
      <ScreenTitle style={styles.title}>Trends</ScreenTitle>

      {/* Summary first. These numbers used to be absent entirely; the only way to
          read a value was to tap a chart point, which was invisible as a target. */}
      {stats ? (
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsRow}>
            <Stat
              label="Time in range"
              value={`${stats.timeInRange}%`}
              tone={stats.timeInRange >= 70 ? colors.inRange : colors.low}
            />
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            {/* Just "Average" — "Average (mg/dL)" broke mid-token in the column.
                The unit is already on the value and in the chart subtitle. */}
            <Stat label="Average" value={`${stats.average.toFixed(decimals)}`} unit={unit} />
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <Stat label="Readings" value={String(stats.count)} />
          </View>
          <View style={[styles.breakdown, { borderTopColor: colors.border }]}>
            <Legend color={colors.low} label={`${stats.lowCount} low`} />
            <Legend color={colors.inRange} label={`${stats.inRangeCount} in range`} />
            <Legend color={colors.high} label={`${stats.highCount} high`} />
          </View>
        </View>
      ) : null}

      <ChoicePicker label="View" choices={TREND_MODES} value={mode} onChange={setMode} />

      <ChoicePicker
        label="Range"
        choices={CHART_RANGES.map((r) => ({ value: r.value, label: r.label }))}
        value={range}
        onChange={setRange}
      />

      <View
        style={[styles.chartCard, { backgroundColor: colors.surface }]}
        onLayout={(event) => setChartCardWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.chartHeader}>
          <AppText variant="body" bold>
            {mode === 'daily' ? 'Daily averages' : 'Every reading'}
          </AppText>
          <Caption>
            Target {targetLow}–{targetHigh} {unit} · touch and hold the chart to read a value
          </Caption>
        </View>

        {failed ? (
          <AppText variant="body" tone="muted" style={styles.centered}>
            Could not load your readings. Pull down on History to retry.
          </AppText>
        ) : !loaded || chartWidth === 0 ? (
          <View style={[styles.placeholder, { backgroundColor: colors.surfaceMuted }]} />
        ) : chartData.length > 0 ? (
          <LineChart
            data={labeledChartData}
            height={chartHeight.full}
            width={chartWidth}
            thickness={3}
            color={colors.primary}
            maxValue={maxValue - minValue}
            yAxisOffset={minValue}
            hideRules
            yAxisTextStyle={{ color: colors.textMuted, fontSize: axisFontSize }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: axisFontSize }}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            dataPointsRadius={5}
            curved
            adjustToWidth={mode === 'daily'}
            disableScroll={mode === 'daily'}
            initialSpacing={28}
            // Enough room for the final x-axis label; at 32 the last weekday
            // rendered clipped against the plot's right edge.
            endSpacing={52}
            spacing={mode === 'readings' ? 52 : undefined}
            yAxisLabelWidth={yAxisLabelWidth}
            showFractionalValues={unit === 'mmol/L'}
            roundToDigits={decimals}
            formatYLabel={(label) => Number(label).toFixed(decimals)}
            showReferenceLine1
            referenceLine1Position={targetHigh}
            referenceLine1Config={{ color: colors.high, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
            showReferenceLine2
            referenceLine2Position={targetLow}
            referenceLine2Config={{ color: colors.low, dashWidth: 4, dashGap: 4, thickness: 1.5 }}
            // A drag anywhere on the plot, rather than a 5px per-point tap target.
            pointerConfig={{
              pointerStripHeight: chartHeight.full,
              pointerStripColor: colors.textMuted,
              pointerStripWidth: 1.5,
              pointerColor: colors.primary,
              radius: 6,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelWidth: 150,
              pointerLabelHeight: 74,
              pointerLabelComponent: (items: ChartDataPoint[]) => {
                const point = items?.[0];
                if (!point) return null;
                return (
                  <View style={[styles.tooltip, { backgroundColor: colors.inverseSurface }]}>
                    <AppText variant="caption" tone="inverse">
                      {point.label || point.context}
                    </AppText>
                    <AppText variant="bodyLg" bold tone="inverse">
                      {point.value.toFixed(decimals)} {unit}
                    </AppText>
                    {point.readingCount > 1 ? (
                      <AppText variant="caption" tone="inverse">
                        {point.readingCount} readings
                      </AppText>
                    ) : null}
                  </View>
                );
              },
            }}
          />
        ) : (
          <AppText variant="bodyLg" tone="muted" style={styles.centered}>
            No readings in this range yet.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        <AppText variant="title" bold style={tone ? { color: tone } : undefined} numberOfLines={1}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <Caption numberOfLines={2} style={styles.statLabel}>
        {label}
      </Caption>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Caption>{label}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  statsCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statLabel: {
    textAlign: 'center',
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: spacing.xs,
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: chartHeight.full,
    justifyContent: 'center',
    overflow: 'hidden',
    ...cardShadow,
  },
  chartHeader: {
    marginBottom: spacing.md,
    gap: 2,
  },
  placeholder: {
    height: chartHeight.full,
    borderRadius: radius.md,
  },
  centered: {
    textAlign: 'center',
  },
  tooltip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 1,
  },
});
