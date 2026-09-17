import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FARD_KEYS, formatTime, type PrayerDay } from '@/lib/prayerTimes';
import type { TranslationKeys } from '@/data/translations';
import { prayerName } from '@/data/translations';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const ID_PREFIX = 'prayer-';
const CHANNEL_ID = 'prayer-times';
// iOS keeps at most 64 pending local notifications; stay below that on every platform.
const MAX_SCHEDULED = 60;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancelPrayerNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

type Options = {
  days: PrayerDay[];
  enabled: boolean;
  atTime: boolean;
  beforeMinutes: number;
  utcOffset: number;
  placeLabel: string;
  t: TranslationKeys;
};

// Schedules local notifications for the coming week. They are recalculated whenever the times or
// settings change and every time the app opens, so the queue stays filled while the app is used.
export function useAdhanNotifications({ days, enabled, atTime, beforeMinutes, utcOffset, placeLabel, t }: Options) {
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const active = enabled && days.length > 0 && (atTime || beforeMinutes > 0);
    const signature = active
      ? JSON.stringify([days.map((d) => d.times), atTime, beforeMinutes, utcOffset, placeLabel, t.notifyAtTitle])
      : 'off';
    if (signature === lastSignature.current) return;

    let cancelled = false;
    (async () => {
      if (!active) {
        await cancelPrayerNotifications();
        lastSignature.current = signature;
        return;
      }
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted || cancelled) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: t.notifyChannelName,
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
      await cancelPrayerNotifications();

      const now = Date.now();
      const queue: { id: string; date: number; title: string; body: string }[] = [];
      for (const day of days) {
        for (const key of FARD_KEYS) {
          const time = day.times[key];
          const name = prayerName(t, key);
          const clock = formatTime(time, utcOffset);
          if (beforeMinutes > 0) {
            queue.push({
              id: `${ID_PREFIX}${day.dateKey}-${key}-before`,
              date: time - beforeMinutes * 60000,
              title: `${name} ${t.notifyInMinutes.replace('{n}', String(beforeMinutes))}`,
              body: `${clock} · ${placeLabel}`,
            });
          }
          if (atTime) {
            queue.push({
              id: `${ID_PREFIX}${day.dateKey}-${key}`,
              date: time,
              title: `${t.notifyAtTitle}: ${name}`,
              body: `${clock} · ${placeLabel}`,
            });
          }
        }
      }

      const upcoming = queue.filter((n) => n.date > now + 5000).sort((a, b) => a.date - b.date).slice(0, MAX_SCHEDULED);
      for (const n of upcoming) {
        if (cancelled) return;
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: { title: n.title, body: n.body, sound: 'default' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.date), channelId: CHANNEL_ID },
        });
      }
      lastSignature.current = signature;
    })().catch(() => {
      lastSignature.current = null;
    });

    return () => {
      cancelled = true;
    };
  }, [days, enabled, atTime, beforeMinutes, utcOffset, placeLabel, t]);
}
