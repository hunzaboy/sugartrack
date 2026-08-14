import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { fontSize, fontFamily, spacing, radius, touchTarget } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }: FieldProps) {
  const { scale, colors } = useAccessibility();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontSize: fontSize.sm * scale, color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { fontSize: fontSize.md * scale, color: colors.text, borderColor: colors.border, fontFamily: fontFamily.regular },
          multiline && styles.multiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.bold,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTarget.minHeight,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  multiline: {
    minHeight: touchTarget.minHeight * 1.5,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
});
