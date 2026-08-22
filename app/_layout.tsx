import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { getDatabase, getProfile } from '../lib/db';
import { colors, fontFamily, fontSize } from '../lib/theme';
import { AccessibilityProvider } from '../lib/accessibility';
import { SnackbarProvider } from '../components/Snackbar';

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
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AccessibilityProvider initialLargeText={initialLargeText}>
          <SnackbarProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                // Headers were 100% platform-default: system font, white bar sitting
                // above the mint body, with a shadow line. Now they read as one surface.
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.primary,
                headerTitleStyle: {
                  fontFamily: fontFamily.bold,
                  fontSize: fontSize.bodyLg,
                  color: colors.text,
                },
                headerShadowVisible: false,
                headerBackButtonDisplayMode: 'minimal',
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen
                name="add-reading"
                options={{ presentation: 'modal', headerShown: true, title: 'Add reading' }}
              />
              <Stack.Screen
                name="reading/[id]"
                options={{ presentation: 'modal', headerShown: true, title: 'Edit reading' }}
              />
              <Stack.Screen name="medications" options={{ headerShown: true, title: 'Medications' }} />
              <Stack.Screen name="a1c" options={{ headerShown: true, title: 'A1C log' }} />
              <Stack.Screen name="export" options={{ headerShown: true, title: 'Export for doctor' }} />
              <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
            </Stack>
          </SnackbarProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
