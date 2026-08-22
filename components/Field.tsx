import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Label, Caption } from './Typography';
import { fontSize, fontFamily, spacing, radius, touchTarget, borderWidth, iconSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  /** Inline validation message. Replaces the Alert-based validation. */
  error?: string | null;
  /** Persistent guidance shown below the input when there is no error. */
  help?: string;
  autoFocus?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  maxLength?: number;
  suffix?: string;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
  help,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  maxLength,
  suffix,
}: FieldProps) {
  const { scale, colors, maxFontSizeMultiplier } = useAccessibility();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={styles.container}>
      <Label style={styles.label}>{label}</Label>
      <View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor: colors.surface,
            minHeight: touchTarget.minHeight * Math.max(scale, 1),
          },
          focused && styles.focused,
          multiline && styles.multilineWrap,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              fontSize: fontSize.bodyLg * scale,
              color: colors.text,
              fontFamily: fontFamily.regular,
            },
            multiline && styles.multiline,
          ]}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={error ?? help}
        />
        {suffix ? <Label tone="muted" style={styles.suffix}>{suffix}</Label> : null}
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={iconSize.sm} color={colors.danger} />
          <Caption tone="danger" style={styles.messageText}>
            {error}
          </Caption>
        </View>
      ) : help ? (
        <Caption style={styles.helpText}>{help}</Caption>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: borderWidth.thin,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  focused: {
    borderWidth: borderWidth.thick,
  },
  multilineWrap: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: touchTarget.minHeight,
    textAlignVertical: 'top',
  },
  suffix: {
    marginLeft: spacing.sm,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  messageText: {
    flex: 1,
  },
  helpText: {
    marginTop: spacing.xs,
  },
});
