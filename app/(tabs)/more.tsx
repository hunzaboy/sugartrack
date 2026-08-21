import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ScreenTitle } from '../../components/Typography';
import { colors, fontSize, spacing, radius, touchTarget, cardShadow } from '../../lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const MENU_ITEMS: {
  href: '/medications' | '/a1c' | '/export' | '/settings';
  label: string;
  icon: IoniconName;
}[] = [
  { href: '/medications', label: 'Medications', icon: 'medical-outline' },
  { href: '/a1c', label: 'A1C log', icon: 'water-outline' },
  { href: '/export', label: 'Export for doctor', icon: 'document-text-outline' },
  { href: '/settings', label: 'Profile, backup & settings', icon: 'settings-outline' },
];

export default function More() {
  return (
    <Screen scroll style={styles.content}>
      <ScreenTitle>More</ScreenTitle>

      {MENU_ITEMS.map((item) => (
        <Pressable key={item.href} style={styles.row} onPress={() => router.push(item.href)}>
          <View style={styles.icon}>
            <Ionicons name={item.icon} size={24} color={colors.primary} />
          </View>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginRight: spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
});
