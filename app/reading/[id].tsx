import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ReadingForm } from '../../components/ReadingForm';
import { getReading, updateReading, deleteReading } from '../../lib/readings';
import { savePhotoFromUri, deletePhoto } from '../../lib/photos';
import { colors } from '../../lib/theme';
import type { Reading } from '../../lib/types';

export default function EditReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const readingId = Number(id);
  const [reading, setReading] = useState<Reading | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getReading(readingId).then((r) => {
      setReading(r);
      setLoaded(true);
    });
  }, [readingId]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!reading) {
    return null;
  }

  const handleDelete = () => {
    Alert.alert('Delete Reading', 'Are you sure you want to delete this reading?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deletePhoto(reading.photo_uri);
          await deleteReading(readingId);
          router.back();
        },
      },
    ]);
  };

  return (
    <ReadingForm
      initial={reading}
      unit={reading.unit}
      submitLabel="Save Changes"
      onDelete={handleDelete}
      onSubmit={async (data) => {
        let photoUri = reading.photo_uri;
        if (data.photoChanged) {
          deletePhoto(reading.photo_uri);
          photoUri = data.photoUri ? await savePhotoFromUri(data.photoUri) : null;
        }
        await updateReading(readingId, { ...data, photo_uri: photoUri });
        router.back();
      }}
    />
  );
}
