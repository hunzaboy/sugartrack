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
  readingsToLineData,
  startOfWindow,
  chartViewConfig,
  chartMaxValue,
  chartMinValue,
  convertReadingsToUnit,
  rangeStats,
  CHART_VIEWS,
  CHART_WINDOW_DAYS,
} from '../../lib/chartData';
import type { ChartDataPoint, ChartView } from '../../lib/chartData';
import { cardShadow, chartHeight, fontSize, radius, spacing } from '../../lib/theme';
import { useAccessibility } from '../../lib/accessibility';
import { formatReadingTimestamp } from '../../lib/datetime';
import { READING_CONTEXTS } from '../../lib/types';
import type { Reading, Profile } from '../../lib/types';

/** Raw context values are stored, not shown: "after_meal" reads as "After meal". */
function contextLabel(context: string): string {
  return READING_CONTEXTS.find((item) => item.value === context)?.label ?? context;
}

export default function Graph() {
  const { colors, scale } = useAccessibility();
  const [view, setView] = useState<ChartView>('days');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chartCardWidth, setChartCardWidth] = useState(0);

  // One window for both views, so the summary always describes the chart.
  useFocusEffect(
    useCallback(() => {
      setLoaded(false);
      setFailed(false);
      const start = startOfWindow();
      Promise.all([listReadingsInRange(start.toISOString(), new Date().toISOString()), getProfile()])
        .then(([r, p]) => {
          setReadings(r);
          setProfile(p);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoaded(true));
    }, [])
  );

  const config = chartViewConfig(view);
  const targetLow = profile?.target_low ?? 70;
  const targetHigh = profile?.target_high ?? 180;
  const unit = profile?.unit ?? 'mg/dL';
  const decimals = unit === 'mmol/L' ? 1 : 0;

  const normalizedReadings = convertReadingsToUnit(readings, unit);
  const stats = rangeStats(normalizedReadings, targetLow, targetHigh);

  // Every reading is a point in both views — a day with three readings draws
  // three points. The toggle only changes how the x-axis is labelled: by date,
  // or by the time each reading was taken. Days with no readings still take
  // their slot, so skipped days stay visible as gaps rather than pulling their
  // neighbours together.
  const chartData = readingsToLineData(normalizedReadings, targetLow, targetHigh, view, {
    start: startOfWindow(),
    end: new Date(),
  });

  const plotted = chartData
    .map((point) => point.value)
    .filter((value): value is number => value !== undefined);
  const maxValue = chartMaxValue(plotted, targetHigh, unit);
  const minValue = chartMinValue(plotted, targetLow, unit);
  // Spacing is also each x-axis label's container width, so it has to grow with
  // the text scale — otherwise Large Text clips the labels it is meant to help.
  const pointSpacing = Math.round(config.spacing * Math.max(scale, 1));
  const axisFontSize = fontSize.caption * scale;
  const yAxisLabelWidth = Math.ceil((unit === 'mmol/L' ? 38 : 42) * scale);
  // The viewport width. The chart's content is wider than this and scrolls —
  // that is the point. Passing no width would make the ScrollView as wide as
  // its content and nothing would scroll.
  const viewportWidth = Math.max(chartCardWidth - spacing.md * 2 - yAxisLabelWidth, 0);

  // No shaded target band. Both routes the library offers put it in the wrong
  // place: `spreadAreaData` plots raw values and ignores `yAxisOffset`, and
  // `customBackground` is positioned against the wrapper rather than the plot
  // area, landing ~35 mg/dL high. A target zone drawn at the wrong level is
  // worse than none on a health chart, and the labelled threshold lines below
  // already say exactly where the range is.

  return (
    <Screen scroll style={styles.content}>
      <ScreenTitle style={styles.title}>Trends</ScreenTitle>

      {stats ? (
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsRow}>
            <Stat
              label="Time in range"
              value={`${stats.timeInRange}%`}
              tone={stats.timeInRange >= 70 ? colors.inRange : colors.low}
            />
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <Stat label="Average" value={stats.average.toFixed(decimals)} unit={unit} />
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

      {/* The entire control surface: two short chips that always sit on one
          row. The previous three range pills wrapped onto a second line, and
          onto three lines at larger text sizes. */}
      <ChoicePicker
        label="View"
        choices={CHART_VIEWS.map((v) => ({ value: v.value, label: v.label }))}
        value={view}
        onChange={setView}
      />

      <View
        style={[styles.chartCard, { backgroundColor: colors.surface }]}
        onLayout={(event) => setChartCardWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.chartHeader}>
          <AppText variant="body" bold>
            {config.title}
          </AppText>
          <Caption>Last {CHART_WINDOW_DAYS} days · touch and hold for details</Caption>
        </View>

        {failed ? (
          <AppText variant="body" tone="muted" style={styles.centered}>
            Could not load your readings. Pull down on History to retry.
          </AppText>
        ) : !loaded || viewportWidth === 0 ? (
          <View style={[styles.placeholder, { backgroundColor: colors.surfaceMuted }]} />
        ) : stats ? (
          <LineChart
            key={view}
            data={chartData}
            height={chartHeight.full}
            width={viewportWidth}
            // Fixed spacing + scrolling, instead of squeezing the range into one
            // screen. `spacing` is also each x-axis label's container width, so
            // this is what stops labels being ellipsised and dropped.
            spacing={pointSpacing}
            // Do not invent readings. With interpolation on (the library
            // default) a stretch of days with no readings was drawn as a long
            // straight line that crossed the high threshold — implying weeks of
            // high readings where there was simply no data. A gap must read as
            // a gap on a health chart.
            interpolateMissingValues={false}
            extrapolateMissingValues={false}
            scrollToEnd
            scrollAnimation={false}
            showScrollIndicator
            // The chart's horizontal ScrollView lives inside the screen's
            // vertical one.
            nestedScrollEnabled
            // Each end needs at least half a label box, since labels are centred
            // on their point. 0.7 clears that without wasting plot width.
            // A full slot in front so the first label, which is centred on the
            // first point, is not cut off; less at the end, which is only dead
            // space once the chart has scrolled to the newest reading.
            initialSpacing={pointSpacing}
            endSpacing={Math.round(pointSpacing * 0.6)}
            thickness={3}
            color={colors.primary}
            // No `colors` band-recolouring of the line. It renders through an
            // SVG mask over the line path, and with interpolation disabled the
            // path is broken by design — the mask then filled the whole plot
            // with solid blocks. Status still reads from the dot colours, which
            // is the agreed design.
            maxValue={maxValue - minValue}
            yAxisOffset={minValue}
            noOfSections={4}
            hideRules
            yAxisTextStyle={{ color: colors.textMuted, fontSize: axisFontSize }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: axisFontSize }}
            /**
             * This is what sets the gap between the axis line and the labels.
             *
             * The label box is anchored by its *bottom* and grows upward, so a
             * taller box pushes the text up onto the axis line and a shorter one
             * drops it clear. Keep it just tall enough for one line.
             * `xAxisLabelsVerticalShift` looks like the right prop but is not —
             * it offsets the wrapper containing both the plot and the labels, so
             * they move together and the gap never changes.
             */
            xAxisLabelsHeight={Math.round(18 * Math.max(scale, 1))}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            yAxisLabelWidth={yAxisLabelWidth}
            dataPointsRadius={5}
            curved
            showFractionalValues={unit === 'mmol/L'}
            roundToDigits={decimals}
            formatYLabel={(label) => Number(label).toFixed(decimals)}
            // Reference lines sit in a fixed layer, so the thresholds stay put
            // while the data scrolls underneath.
            showReferenceLine1
            referenceLine1Position={targetHigh}
            referenceLine1Config={{
              color: colors.high,
              dashWidth: 6,
              dashGap: 5,
              thickness: 1.5,
            }}
            showReferenceLine2
            referenceLine2Position={targetLow}
            referenceLine2Config={{
              color: colors.low,
              dashWidth: 6,
              dashGap: 5,
              thickness: 1.5,
            }}
            pointerConfig={{
              pointerStripHeight: chartHeight.full,
              pointerStripColor: colors.textMuted,
              pointerStripWidth: 1.5,
              pointerColor: colors.primary,
              radius: 6,
              // Long-press, not touch. The pointer defaults to grabbing the
              // gesture the instant a finger lands, which swallowed the
              // horizontal swipe and made the chart impossible to scroll.
              // Swipe pans; touch and hold inspects a day.
              activatePointersOnLongPress: true,
              activatePointersDelay: 200,
              autoAdjustPointerLabelPosition: true,
              hidePointerForMissingValues: true,
              pointerLabelWidth: 170,
              pointerLabelHeight: 78,
              pointerLabelComponent: (items: ChartDataPoint[]) => {
                const point = items?.[0];
                if (!point || point.value === undefined) return null;
                return (
                  <View style={[styles.tooltip, { backgroundColor: colors.inverseSurface }]}>
                    <AppText variant="caption" tone="inverse">
                      {formatReadingTimestamp(point.timestamp)}
                    </AppText>
                    <AppText variant="bodyLg" bold tone="inverse">
                      {point.value.toFixed(decimals)} {unit}
                    </AppText>
                    <AppText variant="caption" tone="inverse">
                      {contextLabel(point.context)}
                      {point.readingCount > 1 ? ` · ${point.readingCount} that day` : ''}
                    </AppText>
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
    // No fixed height or centring: the chart plus its label row decides the
    // height, otherwise the labels are clipped against the card's edge.
    paddingBottom: spacing.lg,
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
