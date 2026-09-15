import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAdhanNotifications } from '@/hooks/useAdhanNotifications';
import { prayerSchedules, GPS_CITY } from '@/data/prayerTimes';

export default function RootLayout() {
  useFrameworkReady();
  const { t, lang } = useLanguage();
  const [settings] = useSettings();
  const { timings, refresh } = usePrayerTimes(settings.city, settings.madhab);
  const schedule = prayerSchedules[settings.city];
  const cityLabel = settings.city === GPS_CITY ? t.cityGpsOption : (schedule ? (lang === 'ky' ? schedule.cityKy : schedule.city) : settings.city);
  useAdhanNotifications(timings, settings.notificationsEnabled, cityLabel, t, refresh);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="asma" options={{ presentation: 'card' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
