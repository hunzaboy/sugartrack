import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, fontSize } from '../../lib/theme';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: fontSize.md, color: focused ? colors.primary : colors.textMuted }}>{symbol}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.sm - 4, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon symbol="⌂" focused={focused} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ focused }) => <TabIcon symbol="≡" focused={focused} /> }}
      />
      <Tabs.Screen
        name="graph"
        options={{ title: 'Trends', tabBarIcon: ({ focused }) => <TabIcon symbol="📈" focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ focused }) => <TabIcon symbol="•••" focused={focused} /> }}
      />
    </Tabs>
  );
}
