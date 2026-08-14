import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ReadingForm } from '../components/ReadingForm';
import { addReading } from '../lib/readings';
import { getProfile } from '../lib/db';
import { savePhotoFromUri } from '../lib/photos';
import { colors } from '../lib/theme';
import type { GlucoseUnit } from '../lib/types';

export default function AddReadingScreen() {
  const [unit, setUnit] = useState<GlucoseUnit | null>(null);

  useEffect(() => {
    getProfile().then((profile) => setUnit(profile?.unit ?? 'mg/dL'));
  }, []);

  if (!unit) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ReadingForm
      unit={unit}
      submitLabel="Save Reading"
      onSubmit={async (data) => {
        const photoUri = data.photoUri ? await savePhotoFromUri(data.photoUri) : null;
        await addReading({ ...data, photo_uri: photoUri });
        router.back();
      }}
    />
  );
}
