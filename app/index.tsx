import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { getProfile } from '../lib/db';
import { colors } from '../lib/theme';

export default function Index() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    getProfile().then((profile) => setHasProfile(profile !== null));
  }, []);

  if (hasProfile === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={hasProfile ? '/(tabs)' : '/onboarding'} />;
}
