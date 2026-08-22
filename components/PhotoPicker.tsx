import { useState } from 'react';
import { View, Image, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Label } from './Typography';
import { spacing, radius, touchTarget, borderWidth, iconSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';
import { tapFeedback } from '../lib/haptics';

interface PhotoPickerProps {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoPicker({ uri, onChange }: PhotoPickerProps) {
  const { scale, colors } = useAccessibility();
  const [busy, setBusy] = useState(false);

  const takePhoto = async () => {
    tapFeedback();
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
    tapFeedback();
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

  const minHeight = touchTarget.minHeight * Math.max(scale, 1);

  return (
    <View style={styles.container}>
      <Label style={styles.label}>Food photo (optional)</Label>

      {uri ? (
        <View>
          <Image
            source={{ uri }}
            style={[styles.preview, { backgroundColor: colors.surfaceMuted }]}
            accessibilityLabel="Attached food photo"
          />
          <Pressable
            onPress={() => {
              tapFeedback();
              onChange(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            android_ripple={{ color: colors.surfaceRipple }}
            style={({ pressed }) => [
              styles.action,
              styles.removeButton,
              { minHeight, borderColor: colors.danger },
              pressed && { backgroundColor: colors.dangerSoft },
            ]}
          >
            <Ionicons name="trash-outline" size={iconSize.md} color={colors.danger} />
            <AppText variant="body" bold tone="danger">
              Remove photo
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          {/* Real icons, not emoji — emoji were being read literally by TalkBack. */}
          <PickerButton
            icon="camera-outline"
            label="Camera"
            onPress={takePhoto}
            busy={busy}
            minHeight={minHeight}
          />
          <PickerButton
            icon="images-outline"
            label="Gallery"
            onPress={pickFromGallery}
            busy={busy}
            minHeight={minHeight}
          />
        </View>
      )}
    </View>
  );
}

function PickerButton({
  icon,
  label,
  onPress,
  busy,
  minHeight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  busy: boolean;
  minHeight: number;
}) {
  const { colors } = useAccessibility();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy }}
      android_ripple={{ color: colors.surfaceRipple }}
      style={({ pressed }) => [
        styles.action,
        styles.flex,
        { minHeight, borderColor: colors.borderStrong, backgroundColor: colors.surface },
        pressed && { backgroundColor: colors.primarySoft },
        busy && styles.blocked,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Ionicons name={icon} size={iconSize.md} color={colors.primary} />
      )}
      <AppText variant="body" bold>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: borderWidth.thick,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  removeButton: {
    marginTop: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
  },
  blocked: {
    opacity: 0.5,
  },
});
