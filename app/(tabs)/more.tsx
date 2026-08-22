import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ListRow } from '../../components/ListRow';
import { ScreenTitle } from '../../components/Typography';
import { spacing } from '../../lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const MENU_ITEMS: {
  href: '/medications' | '/a1c' | '/export' | '/settings';
  label: string;
  subtitle: string;
  icon: IoniconName;
}[] = [
  {
    href: '/medications',
    label: 'Medications',
    subtitle: 'Log what you take and when',
    icon: 'medical-outline',
  },
  {
    href: '/a1c',
    label: 'A1C log',
    subtitle: 'Record your lab results',
    icon: 'water-outline',
  },
  {
    href: '/export',
    label: 'Export for doctor',
    subtitle: 'Save a PDF report',
    icon: 'document-text-outline',
  },
  {
    href: '/settings',
    label: 'Settings',
    subtitle: 'Profile, targets, reminders and backup',
    icon: 'settings-outline',
  },
];

export default function More() {
  return (
    <Screen scroll style={styles.content}>
      <ScreenTitle>More</ScreenTitle>

      {MENU_ITEMS.map((item) => (
        <ListRow
          key={item.href}
          title={item.label}
          subtitle={item.subtitle}
          icon={item.icon}
          onPress={() => router.push(item.href)}
        />
      ))}
    </Screen>
  );
}

const styles = {
  content: {
    paddingHorizontal: spacing.lg,
  },
} as const;
