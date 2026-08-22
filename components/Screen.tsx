import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../lib/theme';
import { useAccessibility } from '../lib/accessibility';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Leave off when the screen owns a FlatList. */
  scroll?: boolean;
  /** Screens with a native header don't need to reserve the status bar themselves. */
  header?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tab screens render without a navigation header while Android draws edge-to-edge,
 * so each one has to reserve the status bar height itself.
 */
export function Screen({ children, scroll = false, header = false, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAccessibility();
  const topPadding = { paddingTop: header ? spacing.md : insets.top + spacing.md };
  const background = { backgroundColor: colors.background };

  if (scroll) {
    return (
      <ScrollView
        style={[styles.screen, background]}
        contentContainerStyle={[topPadding, styles.scrollContent, style]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.screen, background, topPadding, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
});
