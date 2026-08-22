import { useCallback, useMemo, useState } from 'react';
import { View, SectionList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { ReadingCard } from '../../components/ReadingVisuals';
import { Screen } from '../../components/Screen';
import { AppText, Eyebrow, ScreenTitle } from '../../components/Typography';
import { listReadings } from '../../lib/readings';
import { getProfile } from '../../lib/db';
import { iconSize, radius, spacing } from '../../lib/theme';
import { useAccessibility } from '../../lib/accessibility';
import { tapFeedback } from '../../lib/haptics';
import { formatDayLabel } from '../../lib/datetime';
import type { Reading, Profile } from '../../lib/types';

interface Section {
  title: string;
  data: Reading[];
}

/** Group readings under Today / Yesterday / weekday / date headings. */
function groupByDay(readings: Reading[]): Section[] {
  const now = new Date();
  const sections: Section[] = [];
  for (const reading of readings) {
    const title = formatDayLabel(reading.timestamp, now);
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(reading);
    else sections.push({ title, data: [reading] });
  }
  return sections;
}

export default function History() {
  const { colors } = useAccessibility();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    return Promise.all([listReadings(), getProfile()])
      .then(([r, p]) => {
        setReadings(r);
        setProfile(p);
      })
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const sections = useMemo(() => groupByDay(readings), [readings]);

  const targetLow = profile?.target_low ?? 70;
  const targetHigh = profile?.target_high ?? 180;

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <ScreenTitle style={styles.title}>History</ScreenTitle>
          {readings.length > 0 ? (
            <AppText variant="body" tone="muted">
              {readings.length} {readings.length === 1 ? 'reading' : 'readings'}
            </AppText>
          ) : null}
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            readings.length > 0 ? (
              <Button
                title="Add reading"
                icon="add"
                onPress={() => router.push('/add-reading')}
                style={styles.addButton}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load().finally(() => setRefreshing(false));
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <Eyebrow style={styles.sectionHeader}>{section.title}</Eyebrow>
          )}
          ListEmptyComponent={
            loaded ? (
              <View style={styles.empty}>
                <Ionicons name="list-outline" size={iconSize.xl} color={colors.textMuted} />
                <AppText variant="bodyLg" bold style={styles.emptyTitle}>
                  No readings yet
                </AppText>
                <AppText variant="body" tone="muted" style={styles.emptyText}>
                  Readings you add will be listed here, newest first.
                </AppText>
                <Button
                  title="Add your first reading"
                  icon="add"
                  onPress={() => router.push('/add-reading')}
                  style={styles.emptyButton}
                />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                tapFeedback();
                router.push(`/reading/${item.id}`);
              }}
              accessibilityRole="button"
              accessibilityHint="Opens this reading to edit or delete it"
              android_ripple={{ color: colors.surfaceRipple }}
              style={styles.row}
            >
              {/* Full "Today, 3:45 pm" on every row, not just the time: the
                  date heading scrolls out of view, and a row on its own — or
                  copied into a message to a doctor — has to say which day it
                  belongs to. */}
              <ReadingCard reading={item} targetLow={targetLow} targetHigh={targetHigh} />
            </Pressable>
          )}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  addButton: {
    marginBottom: spacing.xs,
  },
  emptyButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.sm,
  },
  emptyText: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
