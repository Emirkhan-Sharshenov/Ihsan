import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { PrayerTime } from '@/data/prayerTimes';
import type { TranslationKeys } from '@/data/translations';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ID_PREFIX = 'adhan-';
const CHANNEL_ID = 'adhan';
const REMINDER_MINUTES_BEFORE = 15;

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Adhan',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

async function cancelAdhanNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

function reminderDateToday(time: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  date.setMinutes(date.getMinutes() - REMINDER_MINUTES_BEFORE);
  return date;
}

// Local notifications are scheduled once per prayer for "today" only — there is no
// background task to compute tomorrow's astronomically-shifted times ahead of time.
// Rescheduling on every foreground keeps it correct as long as the app is opened daily.
export function useAdhanNotifications(timings: PrayerTime[], enabled: boolean, cityLabel: string, t: TranslationKeys, refresh: () => void) {
  const scheduledDayRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!enabled || timings.length === 0) {
      cancelAdhanNotifications();
      scheduledDayRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted' || cancelled) return;

      await ensureAndroidChannel();
      await cancelAdhanNotifications();

      const todayKey = new Date().toDateString();
      const now = Date.now();
      for (const prayer of timings) {
        const date = reminderDateToday(prayer.time);
        if (!date || date.getTime() <= now) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `${ID_PREFIX}${prayer.name}-${todayKey}`,
          content: {
            title: `${prayer.name} — ${t.notifyPrayerSoonTitle}`,
            body: `${t.notifyPrayerSoonBody} · ${cityLabel}`,
            sound: 'default',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
        });
      }
      scheduledDayRef.current = todayKey;
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, timings, cityLabel, t]);

  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const todayKey = new Date().toDateString();
      if (scheduledDayRef.current !== todayKey) {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [enabled, refresh]);
}
