import { View, StyleSheet } from 'react-native';
import { AppText, Caption } from './Typography';
import { useAccessibility } from '../lib/accessibility';
import { cardShadow, fontSize, radius, spacing, statusColor } from '../lib/theme';
import { getReadingStatus, READING_CONTEXTS } from '../lib/types';
import type { Reading, ReadingStatus } from '../lib/types';
import { formatReadingTimestamp } from '../lib/datetime';

interface StatusChipProps {
  status: ReadingStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const { colors, scale } = useAccessibility();
  const { fg, bg, label } = statusColor(status, colors);

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <View style={[styles.chipDot, { backgroundColor: fg, width: 10 * scale, height: 10 * scale }]} />
      <AppText variant="caption" bold style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}

interface TargetRangeBarProps {
  value: number;
  targetLow: number;
  targetHigh: number;
}

export function TargetRangeBar({ value, targetLow, targetHigh }: TargetRangeBarProps) {
  const { colors } = useAccessibility();
  const scaleMax = Math.max(targetHigh * 1.35, value * 1.1, 1);
  const lowWidth = Math.min((targetLow / scaleMax) * 100, 100);
  const inRangeWidth = Math.min(((targetHigh - targetLow) / scaleMax) * 100, 100 - lowWidth);
  const highWidth = Math.max(100 - lowWidth - inRangeWidth, 0);
  const markerPosition = Math.max(1, Math.min((value / scaleMax) * 100, 99));

  return (
    <View
      accessible
      accessibilityLabel={`Target range ${targetLow} to ${targetHigh}. Current value ${value}.`}
    >
      <View style={styles.rangeBar}>
        <View style={{ flex: lowWidth, backgroundColor: colors.low }} />
        <View style={{ flex: inRangeWidth, backgroundColor: colors.inRange }} />
        <View style={{ flex: highWidth, backgroundColor: colors.high }} />
        <View
          style={[
            styles.rangeMarker,
            { left: `${markerPosition}%`, backgroundColor: colors.text, borderColor: colors.surface },
          ]}
        />
      </View>
      <View style={styles.rangeLabels} importantForAccessibility="no-hide-descendants">
        <Caption>{targetLow}</Caption>
        <Caption>Target range</Caption>
        <Caption>{targetHigh}</Caption>
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
  const context =
    READING_CONTEXTS.find((item) => item.value === reading.context)?.label ?? reading.context;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        hero && styles.heroCard,
      ]}
    >
      <View style={styles.cardTopRow}>
        <Caption style={styles.timestamp}>
          {formatReadingTimestamp(reading.timestamp)}
        </Caption>
        <StatusChip status={status} />
      </View>
      <View style={styles.valueRow}>
        {/* The single most important number in the app — it scales like everything else now. */}
        <AppText
          bold
          variant={hero ? 'hero' : 'display'}
          style={{ lineHeight: (hero ? fontSize.hero : fontSize.display) * 1.1 * scale }}
        >
          {reading.value}
        </AppText>
        <AppText variant="body" tone="muted">
          {reading.unit}
        </AppText>
      </View>
      <AppText variant="body" tone="muted">
        {context}
      </AppText>
      {showRange ? (
        <View style={styles.rangeContainer}>
          <TargetRangeBar value={reading.value} targetLow={targetLow} targetHigh={targetHigh} />
        </View>
      ) : null}
      {reading.note ? (
        <AppText variant="body" numberOfLines={2} style={styles.note}>
          {reading.note}
        </AppText>
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
    paddingVertical: spacing.xs,
  },
  chipDot: {
    borderRadius: radius.pill,
  },
  rangeBar: {
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  rangeMarker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 20,
    marginLeft: -2,
    borderRadius: 2,
    borderWidth: 1,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  card: {
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
  rangeContainer: {
    marginTop: spacing.md,
  },
  note: {
    marginTop: spacing.sm,
  },
});
