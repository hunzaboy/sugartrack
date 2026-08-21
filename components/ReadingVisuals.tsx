import { View, Text, StyleSheet } from 'react-native';
import { useAccessibility } from '../lib/accessibility';
import { colors as baseColors, cardShadow, fontFamily, fontSize, radius, spacing } from '../lib/theme';
import { getReadingStatus, READING_CONTEXTS } from '../lib/types';
import type { Reading, ReadingStatus } from '../lib/types';

interface StatusChipProps {
  status: ReadingStatus;
}

const STATUS_LABELS: Record<ReadingStatus, string> = {
  low: 'Low',
  in_range: 'In range',
  high: 'High',
};

export function StatusChip({ status }: StatusChipProps) {
  const { colors } = useAccessibility();
  const color = status === 'low' ? colors.low : status === 'high' ? colors.high : colors.inRange;
  const backgroundColor =
    status === 'low' ? colors.lowBg : status === 'high' ? colors.highBg : colors.inRangeBg;

  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

interface TargetRangeBarProps {
  value: number;
  targetLow: number;
  targetHigh: number;
}

export function TargetRangeBar({ value, targetLow, targetHigh }: TargetRangeBarProps) {
  const scaleMax = Math.max(targetHigh * 1.35, value * 1.1, 1);
  const lowWidth = Math.min((targetLow / scaleMax) * 100, 100);
  const inRangeWidth = Math.min(((targetHigh - targetLow) / scaleMax) * 100, 100 - lowWidth);
  const highWidth = Math.max(100 - lowWidth - inRangeWidth, 0);
  const markerPosition = Math.max(1, Math.min((value / scaleMax) * 100, 99));

  return (
    <View accessibilityLabel={`Target range ${targetLow} to ${targetHigh}. Current value ${value}.`}>
      <View style={styles.rangeBar}>
        <View style={{ flex: lowWidth, backgroundColor: baseColors.low }} />
        <View style={{ flex: inRangeWidth, backgroundColor: baseColors.inRange }} />
        <View style={{ flex: highWidth, backgroundColor: baseColors.high }} />
        <View style={[styles.rangeMarker, { left: `${markerPosition}%` }]} />
      </View>
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{targetLow}</Text>
        <Text style={styles.rangeLabel}>Target range</Text>
        <Text style={styles.rangeLabel}>{targetHigh}</Text>
      </View>
    </View>
  );
}

interface ReadingCardProps {
  reading: Reading;
  targetLow: number;
  targetHigh: number;
  showRange?: boolean;
  hero?: boolean;
}

export function ReadingCard({
  reading,
  targetLow,
  targetHigh,
  showRange = false,
  hero = false,
}: ReadingCardProps) {
  const { scale, colors } = useAccessibility();
  const status = getReadingStatus(reading.value, targetLow, targetHigh);
  const context = READING_CONTEXTS.find((item) => item.value === reading.context)?.label ?? reading.context;

  return (
    <View style={[styles.card, hero && styles.heroCard]}>
      <View style={styles.cardTopRow}>
        <Text style={[styles.timestamp, { color: colors.textMuted, fontSize: (fontSize.sm - 2) * scale }]}>
          {new Date(reading.timestamp).toLocaleString()}
        </Text>
        <StatusChip status={status} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, hero && styles.heroValue, { color: colors.text }]}>
          {reading.value}
        </Text>
        <Text style={[styles.unit, { color: colors.textMuted }]}>{reading.unit}</Text>
      </View>
      <Text style={[styles.context, { color: colors.textMuted }]}>{context}</Text>
      {showRange ? (
        <View style={styles.rangeContainer}>
          <TargetRangeBar value={reading.value} targetLow={targetLow} targetHigh={targetHigh} />
        </View>
      ) : null}
      {reading.note ? (
        <Text numberOfLines={2} style={[styles.note, { color: colors.text }]}>
          {reading.note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm - 3,
  },
  rangeBar: {
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  rangeMarker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 18,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: baseColors.text,
    borderWidth: 1,
    borderColor: baseColors.surface,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rangeLabel: {
    color: baseColors.textMuted,
    fontSize: fontSize.sm - 5,
  },
  card: {
    backgroundColor: baseColors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...cardShadow,
  },
  heroCard: {
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timestamp: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  value: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
  },
  heroValue: {
    fontSize: fontSize.xxl + 8,
  },
  unit: {
    fontSize: fontSize.sm,
  },
  context: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  rangeContainer: {
    marginTop: spacing.md,
  },
  note: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
