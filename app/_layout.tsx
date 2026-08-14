import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { getDatabase, getProfile } from '../lib/db';
import { colors } from '../lib/theme';
import { AccessibilityProvider } from '../lib/accessibility';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initialLargeText, setInitialLargeText] = useState(false);
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    getDatabase()
      .then(() => getProfile())
      .then((profile) => {
        setInitialLargeText(!!profile?.large_text);
        setReady(true);
      });
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AccessibilityProvider initialLargeText={initialLargeText}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="add-reading"
              options={{ presentation: 'modal', headerShown: true, title: 'Add Reading' }}
            />
            <Stack.Screen
              name="reading/[id]"
              options={{ presentation: 'modal', headerShown: true, title: 'Edit Reading' }}
            />
            <Stack.Screen name="medications" options={{ headerShown: true, title: 'Medications' }} />
            <Stack.Screen name="a1c" options={{ headerShown: true, title: 'A1C Log' }} />
            <Stack.Screen name="export" options={{ headerShown: true, title: 'Export for Doctor' }} />
            <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
          </Stack>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
