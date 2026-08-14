import { useCallback, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '../../components/Button';
import { listReadings, deleteReading } from '../../lib/readings';
import { deletePhoto } from '../../lib/photos';
import { colors, fontSize, spacing, radius } from '../../lib/theme';
import type { Reading } from '../../lib/types';
import { READING_CONTEXTS } from '../../lib/types';

export default function History() {
  const [readings, setReadings] = useState<Reading[]>([]);

  const load = useCallback(() => {
    listReadings().then(setReadings);
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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Button title="+ Add" onPress={() => router.push('/add-reading')} style={styles.addButton} />
      </View>

      <FlatList
        data={readings}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No readings logged yet.</Text>}
        renderItem={({ item }) => {
          const contextLabel = READING_CONTEXTS.find((c) => c.value === item.context)?.label ?? item.context;
          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/reading/${item.id}`)}
              onLongPress={() => handleDelete(item)}
            >
              {item.photo_uri ? <Image source={{ uri: item.photo_uri }} style={styles.thumbnail} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowValue}>
                  {item.value} <Text style={styles.rowUnit}>{item.unit}</Text>
                </Text>
                <Text style={styles.rowMeta}>
                  {contextLabel} · {new Date(item.timestamp).toLocaleString()}
                </Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: colors.border,
  },
  rowValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  rowUnit: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.textMuted,
  },
  rowMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowNote: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
