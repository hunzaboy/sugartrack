import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, spacing, radius, touchTarget } from '../../lib/theme';

const MENU_ITEMS: { href: '/medications' | '/a1c' | '/export' | '/settings'; label: string; icon: string }[] = [
  { href: '/medications', label: 'Medications', icon: '💊' },
  { href: '/a1c', label: 'A1C Log', icon: '🩸' },
  { href: '/export', label: 'Export for Doctor', icon: '📄' },
  { href: '/settings', label: 'Profile, Backup & Settings', icon: '⚙️' },
];

export default function More() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>More</Text>

      {MENU_ITEMS.map((item) => (
        <Pressable key={item.href} style={styles.row} onPress={() => router.push(item.href)}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
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
