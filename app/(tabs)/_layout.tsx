import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, fontSize, iconSize, touchTarget } from '../../lib/theme';
import { useAccessibility } from '../../lib/accessibility';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, scale } = useAccessibility();
  const bottomInset = Math.max(insets.bottom, 8);

  const icon =
    (name: IoniconName) =>
    ({ color }: { color: ColorValue; focused: boolean; size: number }) => (
      <Ionicons name={name} size={iconSize.lg} color={color as string} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // The tab bar used to hardcode fontWeight:'600' with no family, so labels
        // rendered in system Roboto while the rest of the app used Inter. It also
        // ignored the in-app text scale entirely.
        tabBarLabelStyle: {
          fontFamily: fontFamily.bold,
          fontSize: fontSize.caption * scale,
        },
        tabBarStyle: {
          height: touchTarget.minHeight * Math.max(scale, 1) + bottomInset + 6,
          paddingBottom: bottomInset,
          paddingTop: 6,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: icon('list') }}
      />
      <Tabs.Screen
        name="graph"
        options={{ title: 'Trends', tabBarIcon: icon('trending-up') }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: icon('ellipsis-horizontal') }}
      />
    </Tabs>
  );
}
