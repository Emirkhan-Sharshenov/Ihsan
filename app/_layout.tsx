import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdhanNotifications } from '@/hooks/useAdhanNotifications';
import { useLocationLabel } from '@/hooks/useLocationLabel';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Amiri_400Regular, Amiri_700Bold });
  const { t } = useLanguage();
  const [settings] = useSettings();
  const { days, location } = usePrayerTimes();
  const placeLabel = useLocationLabel();

  useAdhanNotifications({
    days,
    enabled: settings.notificationsEnabled,
    mutedPrayers: settings.mutedPrayers,
    beforeMinutes: settings.remindBeforeMinutes,
    utcOffset: location?.utcOffset ?? 0,
    placeLabel,
    t,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Keep the splash screen until fonts are ready so text never flashes in the system font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="asma" />
        <Stack.Screen name="about" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
