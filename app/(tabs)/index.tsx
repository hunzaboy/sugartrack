import { useCallback, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { Button } from '../../components/Button';
import { ScreenTitle } from '../../components/Typography';
import { listRecentReadings } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import { readingsToLineData, chartMaxValue } from '../../lib/chartData';
import { colors, fontSize, spacing, radius, statusColor, cardShadow } from '../../lib/theme';
import type { Reading, Profile } from '../../lib/types';
import { READING_CONTEXTS, getReadingStatus } from '../../lib/types';

const screenWidth = Dimensions.get('window').width;

export default function Dashboard() {
  const [recent, setRecent] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

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
  const contextLabel = latest
    ? READING_CONTEXTS.find((c) => c.value === latest.context)?.label ?? latest.context
    : '';
  const status = latest ? getReadingStatus(latest.value, targetLow, targetHigh) : null;
  const statusStyle = status ? statusColor(status) : null;
  const chartData = readingsToLineData(recent, targetLow, targetHigh);
  const maxValue = chartMaxValue(recent.map((r) => r.value), targetHigh);

  return (
    <View style={styles.screen}>
      <ScreenTitle>SugarTrack</ScreenTitle>

      <View style={[styles.card, statusStyle ? { backgroundColor: statusStyle.bg } : null]}>
        {!loaded ? null : latest ? (
          <>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>Latest Reading</Text>
              {statusStyle ? (
                <View style={[styles.badge, { backgroundColor: statusStyle.fg }]}>
                  <Text style={styles.badgeText}>{statusStyle.label}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.value, statusStyle ? { color: statusStyle.fg } : null]}>
              {latest.value} <Text style={styles.unit}>{latest.unit}</Text>
            </Text>
            <Text style={styles.meta}>
              {contextLabel} · {new Date(latest.timestamp).toLocaleString()}
            </Text>
          </>
        ) : (
          <Text style={styles.cardLabel}>No readings yet. Add your first one below.</Text>
        )}
      </View>

      {chartData.length > 1 ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>Recent Trend</Text>
          <LineChart
            data={chartData}
            height={120}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            thickness={3}
            color={colors.primary}
            maxValue={maxValue}
            hideRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
            hideDataPoints={false}
            dataPointsRadius={4}
            curved
            initialSpacing={24}
            endSpacing={24}
            showReferenceLine1
            referenceLine1Position={targetHigh}
            referenceLine1Config={{ color: colors.high, dashWidth: 4, dashGap: 4, thickness: 1 }}
            showReferenceLine2
            referenceLine2Position={targetLow}
            referenceLine2Config={{ color: colors.low, dashWidth: 4, dashGap: 4, thickness: 1 }}
          />
        </View>
      ) : null}

      <Button title="+ Add Reading" onPress={() => router.push('/add-reading')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: 120,
    justifyContent: 'center',
    ...cardShadow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primaryText,
    fontSize: fontSize.sm - 4,
    fontWeight: '700',
  },
  cardLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  unit: {
    fontSize: fontSize.md,
    fontWeight: '400',
    color: colors.textMuted,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  chartLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
