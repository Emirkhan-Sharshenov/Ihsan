import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import { BottomSheet, Chip, PrimaryButton, Toggle } from './ui';
import { colors, fonts } from '@/constants/theme';
import { cities, GPS_CITY, type CalcMethodId } from '@/data/cities';
import { methodName, prayerName } from '@/data/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { useSettings, type AppSettings } from '@/hooks/useSettings';
import { ensureNotificationPermission } from '@/hooks/useAdhanNotifications';
import { requestGpsCoords } from '@/hooks/usePrayerTimes';
import { PRAYER_KEYS } from '@/lib/prayerTimes';

const METHOD_OPTIONS: ('auto' | CalcMethodId)[] = ['auto', 'kyrgyzstan', 'russia', 'mwl', 'ummalqura'];
const REMIND_OPTIONS: AppSettings['remindBeforeMinutes'][] = [0, 10, 15, 30];

export function PrayerSettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const [settings, setSettings] = useSettings();

  const update = (patch: Partial<AppSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const chooseGps = async () => {
    update({ city: GPS_CITY });
    const coords = await requestGpsCoords();
    if (coords) update({ city: GPS_CITY, gpsCoords: coords });
  };

  const toggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      update({ notificationsEnabled: false });
      return;
    }
    const granted = await ensureNotificationPermission();
    if (granted) update({ notificationsEnabled: true });
    else Alert.alert(t.settingsNotifications, t.notifyDenied);
  };

  const adjust = (key: (typeof PRAYER_KEYS)[number], delta: number) =>
    setSettings((prev) => ({
      ...prev,
      adjustments: { ...prev.adjustments, [key]: Math.max(-30, Math.min(30, (prev.adjustments[key] ?? 0) + delta)) },
    }));

  return (
    <BottomSheet visible={visible} title={t.settingsTitle} onClose={onClose}>
      <Text style={styles.label}>{t.settingsCity}</Text>
      <View style={styles.wrap}>
        <Chip
          label={t.cityGpsOption}
          active={settings.city === GPS_CITY}
          onPress={chooseGps}
          icon={<LocateFixed color={settings.city === GPS_CITY ? colors.accentDark : '#94A9BE'} size={14} />}
        />
        {cities.map((city) => (
          <Chip key={city.id} label={lang === 'ky' ? city.ky : city.ru} active={settings.city === city.id} onPress={() => update({ city: city.id })} />
        ))}
      </View>
      {settings.city === GPS_CITY && settings.gpsCoords ? (
        <Pressable onPress={chooseGps} style={styles.inlineLink}>
          <Text style={styles.hint}>
            {settings.gpsCoords.lat.toFixed(3)}, {settings.gpsCoords.lon.toFixed(3)} ·{' '}
          </Text>
          <Text style={styles.link}>{t.cityGpsRefresh}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>{t.settingsMethod}</Text>
      <View style={styles.wrap}>
        {METHOD_OPTIONS.map((m) => (
          <Chip key={m} label={m === 'auto' ? t.methodAuto : methodName(t, m)} active={settings.method === m} onPress={() => update({ method: m })} />
        ))}
      </View>
      {settings.method === 'auto' ? <Text style={styles.hint}>{t.methodAutoHint}</Text> : null}

      <Text style={styles.label}>{t.settingsMadhab}</Text>
      <View style={styles.wrap}>
        <Chip label={t.madhabHanafi} active={settings.madhab === 'hanafi'} onPress={() => update({ madhab: 'hanafi' })} />
        <Chip label={t.madhabShafi} active={settings.madhab === 'shafi'} onPress={() => update({ madhab: 'shafi' })} />
      </View>
      <Text style={styles.hint}>{t.madhabNote}</Text>

      <Text style={styles.label}>{t.settingsNotifications}</Text>
      <Pressable style={styles.row} onPress={toggleNotifications} accessibilityRole="switch" accessibilityState={{ checked: settings.notificationsEnabled }}>
        <Text style={styles.rowText}>{t.notifyAtTimeLabel}</Text>
        <Toggle value={settings.notificationsEnabled} />
      </Pressable>
      {settings.notificationsEnabled ? (
        <>
          <Text style={styles.subLabel}>{t.notifyBeforeLabel}</Text>
          <View style={styles.wrap}>
            {REMIND_OPTIONS.map((m) => (
              <Chip
                key={m}
                label={m === 0 ? t.notifyOff : `${m} ${t.minutesShort}`}
                active={settings.remindBeforeMinutes === m}
                onPress={() => update({ remindBeforeMinutes: m })}
              />
            ))}
          </View>
          <Text style={styles.hint}>{t.notifyHint}</Text>
        </>
      ) : null}

      <Text style={styles.label}>{t.settingsAdjustments}</Text>
      <Text style={styles.hint}>{t.adjustmentsHint}</Text>
      {PRAYER_KEYS.map((key) => (
        <View key={key} style={styles.adjustRow}>
          <Text style={styles.rowText}>{prayerName(t, key)}</Text>
          <Stepper value={settings.adjustments[key] ?? 0} onMinus={() => adjust(key, -1)} onPlus={() => adjust(key, 1)} />
        </View>
      ))}

      <Text style={styles.label}>{t.settingsHijri}</Text>
      <View style={styles.adjustRow}>
        <Text style={[styles.hint, { flex: 1, marginTop: 0 }]}>{t.hijriAdjustHint}</Text>
        <Stepper
          value={settings.hijriAdjust}
          onMinus={() => update({ hijriAdjust: Math.max(-2, settings.hijriAdjust - 1) })}
          onPlus={() => update({ hijriAdjust: Math.min(2, settings.hijriAdjust + 1) })}
        />
      </View>

      <Text style={[styles.hint, styles.disclaimer]}>{t.prayerDisclaimer}</Text>
      <PrimaryButton label={t.done} onPress={onClose} />
    </BottomSheet>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} hitSlop={6} style={styles.stepButton} accessibilityRole="button" accessibilityLabel="-1">
        <Minus color={colors.text} size={16} />
      </Pressable>
      <Text style={styles.stepValue}>{value > 0 ? `+${value}` : value}</Text>
      <Pressable onPress={onPlus} hitSlop={6} style={styles.stepButton} accessibilityRole="button" accessibilityLabel="+1">
        <Plus color={colors.text} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontSize: 15, fontFamily: fonts.bold, marginTop: 20, marginBottom: 10 },
  subLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, marginTop: 12, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { color: colors.textMutedDark, fontSize: 12, fontFamily: fonts.regular, lineHeight: 17, marginTop: 8 },
  inlineLink: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  link: { color: colors.accent, fontSize: 12, fontFamily: fonts.bold },
  disclaimer: { marginTop: 22, color: '#8FA5B9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowText: { color: '#D9E4EE', fontSize: 15, fontFamily: fonts.regular },
  adjustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: '#294765', alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: colors.text, fontSize: 15, fontFamily: fonts.bold, minWidth: 30, textAlign: 'center' },
});
