import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ReadingForm } from '../components/ReadingForm';
import { useSnackbar } from '../components/Snackbar';
import { addReading } from '../lib/readings';
import { getProfile } from '../lib/db';
import { savePhotoFromUri } from '../lib/photos';
import { useAccessibility } from '../lib/accessibility';
import type { GlucoseUnit } from '../lib/types';

export default function AddReadingScreen() {
  const { colors } = useAccessibility();
  const snackbar = useSnackbar();
  const [unit, setUnit] = useState<GlucoseUnit | null>(null);

  useEffect(() => {
    getProfile().then((profile) => setUnit(profile?.unit ?? 'mg/dL'));
  }, []);

  if (!unit) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ReadingForm
      unit={unit}
      submitLabel="Save reading"
      onSubmit={async (data) => {
        const photoUri = data.photoUri ? await savePhotoFromUri(data.photoUri) : null;
        await addReading({ ...data, photo_uri: photoUri });
        router.back();
        // Confirmation lands on the screen behind, rather than as a dialog the
        // user has to dismiss before they can see their own log.
        snackbar.show('Reading saved.', { kind: 'success' });
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
