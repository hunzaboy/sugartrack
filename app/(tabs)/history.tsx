import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '../../components/Button';
import { ReadingCard } from '../../components/ReadingVisuals';
import { Screen } from '../../components/Screen';
import { ScreenTitle } from '../../components/Typography';
import { listReadings, deleteReading } from '../../lib/readings';
import { deletePhoto } from '../../lib/photos';
import { getProfile } from '../../lib/db';
import { colors, fontSize, spacing } from '../../lib/theme';
import type { Reading, Profile } from '../../lib/types';

export default function History() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(() => {
    listReadings().then(setReadings);
    getProfile().then(setProfile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (reading: Reading) => {
    Alert.alert('Delete Reading', 'Are you sure you want to delete this reading?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletePhoto(reading.photo_uri);
          await deleteReading(reading.id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ScreenTitle style={{ marginBottom: 0 }}>History</ScreenTitle>
        <Button title="+ Add" onPress={() => router.push('/add-reading')} style={styles.addButton} />
      </View>

      <FlatList
        data={readings}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No readings logged yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/reading/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          >
            <ReadingCard
              reading={item}
              targetLow={profile?.target_low ?? 70}
              targetHigh={profile?.target_high ?? 180}
            />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  addButton: {
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  empty: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    marginBottom: spacing.sm,
  },
});
