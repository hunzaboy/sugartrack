import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { fontFamily, fontSize } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface HeadingProps extends TextProps {
  style?: TextStyle;
}

export function ScreenTitle({ style, ...props }: HeadingProps) {
  const { scale, colors } = useAccessibility();
  return (
    <Text
      {...props}
      style={[styles.screenTitle, { fontSize: fontSize.xl * scale, color: colors.text }, style]}
    />
  );
}

export function SectionTitle({ style, ...props }: HeadingProps) {
  const { scale, colors } = useAccessibility();
  return (
    <Text
      {...props}
      style={[styles.sectionTitle, { fontSize: fontSize.lg * scale, color: colors.text }, style]}
    />
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontFamily: fontFamily.bold,
    letterSpacing: 0.2,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    letterSpacing: 0.2,
    marginBottom: 18,
  },
});
