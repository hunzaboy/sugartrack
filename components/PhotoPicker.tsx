import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fontSize, spacing, radius, touchTarget } from '../lib/theme';

interface PhotoPickerProps {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoPicker({ uri, onChange }: PhotoPickerProps) {
  const [busy, setBusy] = useState(false);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Please allow camera access to take a food photo.');
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Please allow photo library access to attach a food photo.');
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });
      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Food Photo (optional)</Text>

      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.preview} />
          <Pressable style={styles.removeButton} onPress={() => onChange(null)} accessibilityRole="button">
            <Text style={styles.removeText}>Remove Photo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable style={styles.actionButton} onPress={takePhoto} disabled={busy} accessibilityRole="button">
            <Text style={styles.actionText}>📷 Camera</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={pickFromGallery} disabled={busy} accessibilityRole="button">
            <Text style={styles.actionText}>🖼 Gallery</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: touchTarget.minHeight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  removeButton: {
    marginTop: spacing.sm,
    minHeight: touchTarget.minHeight,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
