import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BookOpen, ChevronRight, Clock3, Compass, Heart, Moon, Search, Settings2, Sparkles, Sunrise, TriangleAlert } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrayerSettingsSheet } from '@/components/PrayerSettingsSheet';
import { colors } from '@/constants/theme';
import { asmaHusna, nameOfTheDayIndex } from '@/data/asmaHusna';
import { duas } from '@/data/duas';
import { hijriMonths, methodName, prayerName } from '@/data/translations';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocationLabel } from '@/hooks/useLocationLabel';
import { useNow } from '@/hooks/useNow';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSettings } from '@/hooks/useSettings';
import { formatDuration, formatGregorian } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { formatTime, getCurrentPrayerKey, getNextPrayer, localDateParts, PRAYER_KEYS } from '@/lib/prayerTimes';

export default function HomeScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const [settings] = useSettings();
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

  const dayIndex = nameOfTheDayIndex();
  const nameOfDay = asmaHusna[dayIndex];
  const duaOfTheDay = useMemo(() => duas[dayIndex % duas.length], [dayIndex]);
  const isFavorite = favorites.includes(duaOfTheDay.slug);

  const quickLinks = [
    { title: t.tabQuran, subtitle: t.homeQuranSubtitle, icon: BookOpen, color: '#D7F3BE', href: '/quran' as const },
    { title: t.tabDuas, subtitle: t.homeDuasSubtitle, icon: Heart, color: '#D7F3BE', href: '/duas' as const },
    { title: t.tabTasbih, subtitle: t.homeTasbihSubtitle, icon: Sparkles, color: '#BCE6F8', href: '/tasbih' as const },
    { title: t.tabQibla, subtitle: t.homeQiblaSubtitle, icon: Compass, color: '#BCE6F8', href: '/qibla' as const },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await prayer.refresh();
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    if (query.trim()) router.push({ pathname: '/duas', params: { q: query.trim() } });
  };

  const sourceLabel = prayer.official ? t.homeSourceOfficial : methodName(t, prayer.method);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0D2945', colors.bg]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <Text style={styles.eyebrow}>{t.homeEyebrow}</Text>
        <Text style={styles.greeting}>{t.homeGreeting}</Text>
        <Text style={styles.date}>
          {formatGregorian(lang, todayParts.year, todayParts.month, todayParts.day)}
          {' · '}
          {hijri.day} {hijriMonths[lang][hijri.month - 1]} {hijri.year} {t.homeHijriSuffix}
        </Text>

        <View style={styles.searchBox}>
          <Search color="#96A9BE" size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.homeSearchPlaceholder}
            placeholderTextColor="#8EA1B5"
            style={styles.searchInput}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>

        <View style={styles.sectionHeading}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{t.homePrayerToday}</Text>
            <Text style={styles.sectionCaption} numberOfLines={2}>
              {placeLabel} · {sourceLabel}
            </Text>
          </View>
          <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton} hitSlop={8} accessibilityRole="button">
            <Settings2 color={colors.accent} size={16} />
            <Text style={styles.linkText}>{t.homeSettingsLink}</Text>
          </Pressable>
        </View>

        {prayer.error === 'gps' ? (
          <Notice text={t.homeGpsError} />
        ) : prayer.error === 'network' ? (
          <Notice text={t.homeNetworkError} />
        ) : null}

        {prayer.loading && !today ? (
          <View style={styles.infoBar}>
            <Text style={styles.infoBarText}>{t.homeLocating}</Text>
          </View>
        ) : next ? (
          <View style={styles.infoBar}>
            <Clock3 color={colors.accent} size={16} />
            <Text style={styles.countdownText}>
              {t.homeCountdown.replace('{name}', prayerName(t, next.key)).replace('{time}', formatDuration(next.time - now, t.hoursShort, t.minutesShort))}
            </Text>
          </View>
        ) : null}

        {today ? (
          <View style={styles.prayerCard}>
            {PRAYER_KEYS.map((key) => {
              const active = key === current && key !== 'sunrise';
              const isSunrise = key === 'sunrise';
              return (
                <View key={key} style={[styles.prayerRow, active && styles.activePrayer]}>
                  {isSunrise ? <Sunrise color="#71869D" size={15} style={styles.prayerIcon} /> : <View style={[styles.prayerMark, active && styles.activeMark]} />}
                  <Text style={[styles.prayerName, isSunrise && styles.sunriseText, active && styles.activePrayerText]}>{prayerName(t, key)}</Text>
                  <Text style={[styles.prayerTime, isSunrise && styles.sunriseText, active && styles.activePrayerText]}>
                    {formatTime(today.times[key], offset)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {today && isRamadan ? (
          <View style={styles.ramadanCard}>
            <Moon color={colors.accentDark} size={18} />
            <Text style={styles.ramadanText}>
              {t.homeSuhur} {formatTime(today.times.fajr, offset)} · {t.homeIftar} {formatTime(today.times.maghrib, offset)}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t.homeQuickAccess}</Text>
        </View>
        <View style={styles.categoryRow}>
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.href} style={({ pressed }) => [styles.categoryCard, pressed && styles.cardPressed]} onPress={() => router.push(item.href)}>
                <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                  <Icon color="#112A42" size={20} strokeWidth={2.2} />
                </View>
                <Text style={styles.categoryTitle}>{item.title}</Text>
                <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t.homeDuaOfDay}</Text>
          <Pressable onPress={() => toggleFavorite(duaOfTheDay.slug)} style={styles.likeButton} hitSlop={8} accessibilityRole="button">
            <Heart color={isFavorite ? colors.heart : '#9BAEC1'} fill={isFavorite ? colors.heart : 'transparent'} size={18} />
          </Pressable>
        </View>
        <Pressable
          style={({ pressed }) => [styles.quoteCard, pressed && styles.quotePressed]}
          onPress={() => router.push({ pathname: '/duas', params: { open: duaOfTheDay.slug } })}
        >
          <Text style={styles.quoteTitle}>{duaOfTheDay.title}</Text>
          <Text style={styles.quoteArabic} numberOfLines={3}>
            {duaOfTheDay.arabic.split('\n\n')[0]}
          </Text>
          <Text style={styles.quoteTranslation} numberOfLines={4}>
            {duaOfTheDay.translation.split('\n\n')[0]}
          </Text>
          <Text style={styles.quoteSource}>{duaOfTheDay.source}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.asmaCard, pressed && styles.quotePressed]} onPress={() => router.push('/asma')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.asmaLabel}>{t.homeAsmaCardTitle}</Text>
            <Text style={styles.asmaName}>
              {nameOfDay.transliteration} · {nameOfDay.ru}
            </Text>
          </View>
          <Text style={styles.asmaArabic}>{nameOfDay.arabic}</Text>
          <ChevronRight color={colors.accentDark} size={20} />
        </Pressable>
      </ScrollView>

      <PrayerSettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <View style={styles.errorBar}>
      <TriangleAlert color="#F0C96B" size={15} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  greeting: { color: colors.text, fontSize: 29, fontWeight: '700', marginTop: 8 },
  date: { color: '#94A9BE', fontSize: 13, marginTop: 6, lineHeight: 19 },
  searchBox: { marginTop: 22, height: 50, borderRadius: 18, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  searchInput: { flex: 1, color: colors.text, marginLeft: 11, fontSize: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12, gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  sectionCaption: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  settingsButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 },
  linkText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  errorBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#3A2E1A', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  errorText: { color: '#E8CE9A', fontSize: 12, flex: 1, lineHeight: 17 },
  infoBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A3A52', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  infoBarText: { color: colors.textMuted, fontSize: 13 },
  countdownText: { color: colors.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  prayerCard: { backgroundColor: colors.card, borderRadius: 20, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  prayerRow: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 14, marginHorizontal: 7 },
  activePrayer: { backgroundColor: colors.activePrayerBg },
  prayerMark: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#50677D', marginRight: 12, marginLeft: 4 },
  prayerIcon: { marginRight: 8 },
  activeMark: { backgroundColor: colors.accent },
  prayerName: { flex: 1, color: '#B4C3D2', fontSize: 15 },
  prayerTime: { color: '#EAF2F8', fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sunriseText: { color: '#71869D', fontWeight: '500' },
  activePrayerText: { color: '#F4FFF0' },
  ramadanCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accentSoft, borderRadius: 14, padding: 12, marginTop: 10 },
  ramadanText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: colors.border },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  categoryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  categorySubtitle: { color: '#8298AE', fontSize: 11, marginTop: 3 },
  likeButton: { padding: 8, backgroundColor: colors.card, borderRadius: 12 },
  quoteCard: { backgroundColor: colors.quoteCard, borderRadius: 22, padding: 20, alignItems: 'center' },
  quotePressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  quoteTitle: { color: colors.quoteMuted, fontSize: 12, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  quoteArabic: { color: colors.quoteText, fontSize: 22, lineHeight: 38, textAlign: 'center', writingDirection: 'rtl' },
  quoteTranslation: { color: '#30485B', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  quoteSource: { color: colors.quoteMuted, fontSize: 12, marginTop: 9, textAlign: 'center' },
  asmaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accent, borderRadius: 18, padding: 16, marginTop: 12 },
  asmaLabel: { color: '#254024', fontSize: 11, fontWeight: '700' },
  asmaName: { color: colors.accentDark, fontSize: 14, fontWeight: '700', marginTop: 3 },
  asmaArabic: { color: colors.accentDark, fontSize: 20 },
});
