import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ReadingForm } from '../../components/ReadingForm';
import { AppText } from '../../components/Typography';
import { useSnackbar } from '../../components/Snackbar';
import { getReading, updateReading, deleteReading, addReading } from '../../lib/readings';
import { savePhotoFromUri, deletePhoto } from '../../lib/photos';
import { useAccessibility } from '../../lib/accessibility';
import { spacing } from '../../lib/theme';
import type { Reading } from '../../lib/types';

export default function EditReadingScreen() {
  const { colors } = useAccessibility();
  const snackbar = useSnackbar();
  const { id } = useLocalSearchParams<{ id: string }>();
  const readingId = Number(id);
  const [reading, setReading] = useState<Reading | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getReading(readingId)
      .then(setReading)
      .finally(() => setLoaded(true));
  }, [readingId]);

  if (!loaded) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Previously returned null, leaving a blank modal with no explanation.
  if (!reading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <AppText variant="bodyLg" tone="muted" style={styles.message}>
          This reading is no longer in your log.
        </AppText>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete this reading?', 'It will be removed from your log.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReading(readingId);
          router.back();
          // Undo is offered here because this is now the only way to delete a
          // reading, so an accidental tap has to be recoverable. The photo file
          // is kept until the undo window closes, so a restore keeps its image.
          let restored = false;
          snackbar.show('Reading deleted.', {
            kind: 'success',
            action: {
              label: 'Undo',
              onPress: async () => {
                restored = true;
                await addReading({
                  value: reading.value,
                  unit: reading.unit,
                  context: reading.context,
                  timestamp: reading.timestamp,
                  note: reading.note,
                  photo_uri: reading.photo_uri,
                });
              },
            },
          });
          setTimeout(() => {
            if (!restored) deletePhoto(reading.photo_uri);
          }, 8000);
        },
      },
    ]);
  };

  return (
    <ReadingForm
      initial={reading}
      unit={reading.unit}
      submitLabel="Save changes"
      onDelete={handleDelete}
      onSubmit={async (data) => {
        let photoUri = reading.photo_uri;
        if (data.photoChanged) {
          deletePhoto(reading.photo_uri);
          photoUri = data.photoUri ? await savePhotoFromUri(data.photoUri) : null;
        }
        await updateReading(readingId, { ...data, photo_uri: photoUri });
        router.back();
        snackbar.show('Changes saved.', { kind: 'success' });
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  message: { textAlign: 'center' },
});
