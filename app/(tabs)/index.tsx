import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Coordinates, Qibla } from 'adhan';
import {
  ArrowRight,
  Bell,
  BellOff,
  BookOpen,
  ChevronRight,
  Clock3,
  CloudSun,
  Compass,
  Heart,
  Moon,
  MoonStar,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrayerSettingsSheet } from '@/components/PrayerSettingsSheet';
import { ArabicText, Card, IconButton, Note, Pill, ScreenBackground, ScreenHeader, type } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { asmaHusna, nameOfTheDayIndex } from '@/data/asmaHusna';
import { duas, type Dua } from '@/data/duas';
import { hijriMonths, methodName, prayerName, type TranslationKeys } from '@/data/translations';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocationLabel } from '@/hooks/useLocationLabel';
import { useNow } from '@/hooks/useNow';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSettings } from '@/hooks/useSettings';
import { formatDuration, formatGregorian } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { shareText } from '@/lib/share';
import { formatTime, getCurrentPrayerKey, getNextPrayer, localDateParts, PRAYER_KEYS, type PrayerKey } from '@/lib/prayerTimes';

const PRAYER_ICONS: Record<PrayerKey, LucideIcon> = {
  fajr: Moon,
  sunrise: Sunrise,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: MoonStar,
};

function duaShareText(item: Dua, t: TranslationKeys): string {
  return [item.title, item.arabic, item.transliteration, item.translation, `${t.duasSource}: ${item.source}`].join('\n\n');
}

export default function HomeScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const [settings, setSettings] = useSettings();
  const prayer = usePrayerTimes();
  const placeLabel = useLocationLabel();
  const now = useNow(30000);

  const offset = prayer.location?.utcOffset ?? -new Date().getTimezoneOffset();
  const todayParts = localDateParts(offset, 0, now);
  const hijri = toHijri(todayParts.year, todayParts.month, todayParts.day, settings.hijriAdjust);
  const today = prayer.days[0];
  const next = getNextPrayer(prayer.days, now);
  const current = today ? getCurrentPrayerKey(today, now) : null;
  const isRamadan = hijri.month === 9;
  const qibla = prayer.location ? Math.round(Qibla(new Coordinates(prayer.location.lat, prayer.location.lon))) : null;

  const dayIndex = nameOfTheDayIndex();
  const nameOfDay = asmaHusna[dayIndex];
  const duaOfTheDay = useMemo(() => duas[dayIndex % duas.length], [dayIndex]);
  const isFavorite = favorites.includes(duaOfTheDay.slug);

  const tiles = [
    { title: t.tabQuran, subtitle: t.quranCount, icon: BookOpen, href: '/quran' as const },
    { title: t.tabDuas, subtitle: t.homeDuasSubtitle, icon: Sparkles, href: '/duas' as const },
    { title: t.tabTasbih, subtitle: t.homeTasbihSubtitle, icon: Clock3, href: '/tasbih' as const },
    { title: t.tabQibla, subtitle: qibla !== null ? t.homeQiblaTile.replace('{deg}', String(qibla)) : t.homeQiblaSubtitle, icon: Compass, href: '/qibla' as const },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await prayer.refresh();
    setRefreshing(false);
  };

  const togglePrayerBell = (key: PrayerKey) => {
    if (!settings.notificationsEnabled) {
      Alert.alert(t.settingsNotifications, t.notifyTurnOnHint, [{ text: t.done, onPress: () => setShowSettings(true) }]);
      return;
    }
    setSettings((prev) => ({
      ...prev,
      mutedPrayers: prev.mutedPrayers.includes(key) ? prev.mutedPrayers.filter((k) => k !== key) : [...prev.mutedPrayers, key],
    }));
  };

  const sourceLabel = prayer.official ? t.homeSourceOfficial : methodName(t, prayer.method);

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <ScreenHeader
          title={t.tabHome}
          right={
            <IconButton label={t.settingsTitle} onPress={() => setShowSettings(true)} active={settings.notificationsEnabled}>
              <Bell color={settings.notificationsEnabled ? colors.accent : colors.text} size={20} />
            </IconButton>
          }
        />

        <Text style={type.eyebrow}>{t.homeEyebrow}</Text>
        <Text style={[type.display, styles.greeting]}>{t.homeGreeting}</Text>
        <Text style={type.muted}>
          {formatGregorian(lang, todayParts.year, todayParts.month, todayParts.day)} · {hijri.day} {hijriMonths[lang][hijri.month - 1]} {hijri.year} {t.homeHijriSuffix}
        </Text>

        <View style={styles.searchBox}>
          <Search color={colors.textMuted} size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.homeSearchPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            onSubmitEditing={() => query.trim() && router.push({ pathname: '/duas', params: { q: query.trim() } })}
            returnKeyType="search"
          />
        </View>

        <View style={styles.sectionHeading}>
          <View style={{ flex: 1 }}>
            <Text style={type.headline}>{t.homePrayerToday}</Text>
            <Text style={[type.small, { marginTop: 2 }]} numberOfLines={2}>
              {placeLabel} · {sourceLabel}
            </Text>
          </View>
          <Pressable onPress={() => setShowSettings(true)} style={styles.linkButton} hitSlop={8} accessibilityRole="button">
            <Text style={styles.linkText}>{t.homeSettingsLink}</Text>
            <SlidersHorizontal color={colors.accent} size={16} />
          </Pressable>
        </View>

        {prayer.error === 'gps' ? (
          <Note icon={<TriangleAlert color={colors.warnText} size={16} />} text={t.homeGpsError} style={styles.warn} />
        ) : prayer.error === 'network' ? (
          <Note icon={<TriangleAlert color={colors.warnText} size={16} />} text={t.homeNetworkError} style={styles.warn} />
        ) : null}

        <Card style={styles.prayerCard}>
          <View style={styles.nextBar}>
            <Clock3 color={colors.accent} size={16} />
            <Text style={styles.nextText} numberOfLines={2}>
              {prayer.loading && !today ? (
                t.homeLocating
              ) : next ? (
                <>
                  {t.homeNext}{' '}
                  <Text style={{ color: colors.accent }}>
                    {t.homeCountdown.replace('{name}', prayerName(t, next.key)).replace('{time}', formatDuration(next.time - now, t.hoursShort, t.minutesShort))}
                  </Text>
                </>
              ) : null}
            </Text>
            <Text style={styles.madhabChip}>{(settings.madhab === 'hanafi' ? t.madhabShortHanafi : t.madhabShortShafi).toUpperCase()}</Text>
          </View>

          {today
            ? PRAYER_KEYS.map((key) => {
                const Icon = PRAYER_ICONS[key];
                const isSunrise = key === 'sunrise';
                const active = key === current && !isSunrise;
                const muted = settings.mutedPrayers.includes(key);
                const bellOn = settings.notificationsEnabled && !muted;
                return (
                  <View key={key} style={[styles.prayerRow, active && styles.prayerRowActive]}>
                    {active ? <View style={styles.activeDot} /> : <Icon color={isSunrise ? colors.textMutedDark : '#B4C3D2'} size={18} />}
                    <Text style={[styles.prayerName, isSunrise && styles.sunriseText, active && styles.prayerNameActive]}>{prayerName(t, key)}</Text>
                    {active ? <Pill label={t.homeNow} style={styles.nowPill} /> : null}
                    <View style={{ flex: 1 }} />
                    <Text style={[styles.prayerTime, isSunrise && styles.sunriseText, active && styles.prayerTimeActive]}>{formatTime(today.times[key], offset)}</Text>
                    {isSunrise ? (
                      <View style={styles.bell}>
                        <BellOff color={colors.textMutedDark} size={16} />
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => togglePrayerBell(key)}
                        hitSlop={8}
                        style={styles.bell}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: bellOn }}
                        accessibilityLabel={`${t.notifyMuteHint}: ${prayerName(t, key)}`}
                      >
                        {bellOn ? <Bell color={active ? colors.accent : '#B4C3D2'} size={17} /> : <BellOff color={colors.textMutedDark} size={17} />}
                      </Pressable>
                    )}
                  </View>
                );
              })
            : null}
        </Card>

        {today && isRamadan ? (
          <View style={styles.ramadanCard}>
            <Moon color={colors.accentDark} size={18} />
            <Text style={styles.ramadanText}>
              {t.homeSuhur} {formatTime(today.times.fajr, offset)} · {t.homeIftar} {formatTime(today.times.maghrib, offset)}
            </Text>
          </View>
        ) : null}

        <View style={styles.tiles}>
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Pressable key={tile.href} style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={() => router.push(tile.href)}>
                <View style={styles.tileTop}>
                  <View style={styles.tileIcon}>
                    <Icon color={colors.accent} size={20} />
                  </View>
                  <ArrowRight color={colors.textMuted} size={18} />
                </View>
                <Text style={styles.tileTitle}>{tile.title}</Text>
                <Text style={type.small}>{tile.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.duaCard}>
          <View style={styles.duaHeader}>
            <View style={styles.accentBar} />
            <Text style={[type.headline, { flex: 1 }]}>{t.homeDuaOfDay}</Text>
            <IconButton label={t.duasFavorites} onPress={() => toggleFavorite(duaOfTheDay.slug)} style={styles.smallIconButton}>
              <Heart color={isFavorite ? colors.heart : colors.text} fill={isFavorite ? colors.heart : 'transparent'} size={18} />
            </IconButton>
          </View>
          <Pressable onPress={() => router.push({ pathname: '/duas', params: { open: duaOfTheDay.slug } })}>
            <Text style={[type.small, { marginBottom: 4 }]}>{duaOfTheDay.title}</Text>
            <ArabicText size={24} numberOfLines={4}>
              {duaOfTheDay.arabic.split('\n\n')[0]}
            </ArabicText>
            <Text style={[type.body, styles.duaTranslation]} numberOfLines={5}>
              {duaOfTheDay.translation.split('\n\n')[0]}
            </Text>
          </Pressable>
          <View style={styles.duaFooter}>
            <View style={styles.sourceTag}>
              <Text style={styles.sourceTagText} numberOfLines={1}>
                {duaOfTheDay.source}
              </Text>
            </View>
            <Pressable onPress={() => shareText(duaShareText(duaOfTheDay, t))} style={styles.shareLink} hitSlop={8} accessibilityRole="button">
              <Text style={type.small}>{t.homeShare}</Text>
              <Share2 color={colors.textMuted} size={15} />
            </Pressable>
          </View>
        </Card>

        <Pressable onPress={() => router.push('/asma')} style={({ pressed }) => [pressed && styles.pressed]}>
          <Card style={styles.asmaCard}>
            <View style={styles.asmaHeader}>
              <Star color={colors.accent} size={18} />
              <Text style={[type.title, { flex: 1 }]}>{t.homeAsmaCardTitle}</Text>
              <Text style={type.small}>{t.asmaOf.replace('{n}', String(nameOfDay.number))}</Text>
            </View>
            <View style={styles.asmaNameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.asmaName}>{nameOfDay.transliteration}</Text>
                <Text style={type.muted}>{nameOfDay.ru}</Text>
              </View>
              <ArabicText size={26} style={{ color: colors.accent }}>
                {nameOfDay.arabic}
              </ArabicText>
            </View>
            <View style={styles.asmaLink}>
              <Text style={styles.linkText}>{t.homeAllNames}</Text>
              <ChevronRight color={colors.accent} size={16} />
            </View>
          </Card>
        </Pressable>
      </ScrollView>

      <PrayerSettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  greeting: { marginTop: 6, marginBottom: 4 },
  searchBox: { marginTop: 18, height: 52, borderRadius: 16, backgroundColor: colors.cardAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchInput: { flex: 1, color: colors.text, marginLeft: 12, fontSize: 15, fontFamily: fonts.regular },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12, gap: 10 },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  linkText: { color: colors.accent, fontSize: 13, fontFamily: fonts.semibold },
  warn: { backgroundColor: colors.warnBg, borderColor: colors.warnBg, marginBottom: 10 },
  prayerCard: { padding: 10 },
  nextBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cardAlt, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6 },
  nextText: { color: colors.text, fontSize: 13, fontFamily: fonts.medium, flex: 1 },
  madhabChip: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.8, fontFamily: fonts.semibold },
  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 46, paddingHorizontal: 10, borderRadius: 12 },
  prayerRowActive: { backgroundColor: colors.activePrayerBg, height: 52, borderLeftWidth: 3, borderLeftColor: colors.accent },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginHorizontal: 5 },
  prayerName: { color: '#D2DDE8', fontSize: 15, fontFamily: fonts.regular },
  prayerNameActive: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold },
  nowPill: { alignSelf: 'center' },
  prayerTime: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  prayerTimeActive: { fontSize: 17, fontFamily: fonts.bold },
  sunriseText: { color: colors.textMutedDark },
  bell: { width: 28, alignItems: 'center' },
  ramadanCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accent, borderRadius: 14, padding: 12, marginTop: 10 },
  ramadanText: { color: colors.accentDark, fontSize: 14, fontFamily: fonts.semibold },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  tile: { width: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 14 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold, marginBottom: 2 },
  duaCard: { marginTop: 20 },
  duaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  accentBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.accent },
  smallIconButton: { width: 38, height: 38, borderRadius: 12 },
  duaTranslation: { color: '#D2DDE8', marginTop: 10 },
  duaFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 12 },
  sourceTag: { flexShrink: 1, backgroundColor: colors.accentMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  sourceTagText: { color: colors.accent, fontSize: 11, fontFamily: fonts.semibold },
  shareLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  asmaCard: { marginTop: 16 },
  asmaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  asmaNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  asmaName: { color: colors.text, fontSize: 24, fontFamily: fonts.bold, marginBottom: 2 },
  asmaLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
});
