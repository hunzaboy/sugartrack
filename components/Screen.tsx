import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../lib/theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Leave off when the screen owns a FlatList. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tab screens render without a navigation header while Android draws edge-to-edge,
 * so each one has to reserve the status bar height itself.
 */
export function Screen({ children, scroll = false, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = { paddingTop: insets.top + spacing.md };

  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.scrollContent, topPadding, style]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.screen, topPadding, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
});
