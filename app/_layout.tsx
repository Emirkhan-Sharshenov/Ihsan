import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdhanNotifications } from '@/hooks/useAdhanNotifications';
import { useLocationLabel } from '@/hooks/useLocationLabel';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  useFrameworkReady();
  const { t } = useLanguage();
  const [settings] = useSettings();
  const { days, location } = usePrayerTimes();
  const placeLabel = useLocationLabel();

  useAdhanNotifications({
    days,
    enabled: settings.notificationsEnabled,
    atTime: true,
    beforeMinutes: settings.remindBeforeMinutes,
    utcOffset: location?.utcOffset ?? 0,
    placeLabel,
    t,
  });

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
