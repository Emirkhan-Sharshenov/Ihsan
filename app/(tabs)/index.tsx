import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, BookOpen, ChevronRight, Clock3, Compass, Heart, LocateFixed, Search, Sparkles, TriangleAlert, X } from 'lucide-react-native';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '@/hooks/useFavorites';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAsmaHusna, nameOfTheDayIndex } from '@/hooks/useAsmaHusna';
import { cityNames, getCurrentPrayerIndex, getNextPrayer, prayerSchedules, GPS_CITY } from '@/data/prayerTimes';
import { hijriMonths } from '@/data/hijriMonths';
import duaData from './duas/dua_muslimclub.json';
import lifeSituationDuas from './duas/dua_life_situations.json';

type Dua = {
  slug: string;
  title: string;
  category: string;
  arabic: string;
  transliteration: string;
  translation: string;
  description: string;
  source: string;
};

const allDuas = [...(duaData as Dua[]), ...(lifeSituationDuas as Dua[])];

export default function HomeScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, name: '' });

  const { favorites, toggleFavorite } = useFavorites();
  const [settings, setSettings] = useSettings();
  const { timings, loading: prayerLoading, error: prayerError, hijri, refresh: refreshPrayerTimes } = usePrayerTimes(settings.city, settings.madhab);
  const { names: asmaNames } = useAsmaHusna();
  const nameOfDay = asmaNames[nameOfTheDayIndex(asmaNames.length)];
  const [refreshing, setRefreshing] = useState(false);
  const currentPrayerIndex = getCurrentPrayerIndex(timings);

  const categories = useMemo(() => [
    { title: t.tabQuran, subtitle: lang === 'ky' ? 'Сүрөлөр' : 'Суры', icon: BookOpen, color: '#D7F3BE', href: '/quran' as const },
    { title: t.tabDuas, subtitle: lang === 'ky' ? 'Дуалар' : 'Мольбы', icon: Heart, color: '#D7F3BE', href: '/duas' as const },
    { title: t.tabTasbih, subtitle: lang === 'ky' ? 'Зикир' : 'Поминание', icon: Sparkles, color: '#BCE6F8', href: '/tasbih' as const },
    { title: t.tabQibla, subtitle: lang === 'ky' ? 'Багыт' : 'Направление', icon: Compass, color: '#BCE6F8', href: '/qibla' as const },
  ], [t, lang]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPrayerTimes();
    setRefreshing(false);
  };

  const duaOfTheDay = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return allDuas[dayOfYear % allDuas.length];
  }, []);

  const filteredCategories = useMemo(() => categories.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [query, categories]);

  useEffect(() => {
    const update = () => {
      const next = getNextPrayer(timings);
      if (next) {
        setCountdown({ hours: next.hoursUntil, minutes: next.minutesUntil, name: next.prayer.name });
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [timings]);

  const isFavorite = favorites.includes(duaOfTheDay.slug);

  const handleSearchSubmit = () => {
    if (query.trim()) {
      router.push({ pathname: '/duas', params: { q: query.trim() } });
    }
  };

  const dateStr = new Date().toLocaleDateString(lang === 'ky' ? 'ky-KG' : 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const schedule = prayerSchedules[settings.city];
  const isGpsCity = settings.city === GPS_CITY;
  const cityLabel = isGpsCity ? t.cityGpsOption : (schedule ? (lang === 'ky' ? schedule.cityKy : schedule.city) : prayerSchedules['Москва'].city);
  const methodLabel = isGpsCity ? t.cityGpsMethod : (schedule ? (lang === 'ky' ? schedule.methodKy : schedule.method) : '');

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0D2945', '#071526']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A9F06B" />}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>{t.homeEyebrow}</Text>
            <Text style={styles.greeting}>{t.homeGreeting}</Text>
            <Text style={styles.date}>
              {dateStr}
              {hijri ? ` · ${hijri.day} ${hijriMonths[lang][Math.max(0, hijri.monthNumber - 1)]} ${hijri.year} ${t.quranHijriToday}` : ''}
            </Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setShowNotifications(true)} accessibilityLabel={t.homeNotifications}>
            <Bell color="#EAF4FF" size={21} />
            {settings.notificationsEnabled && <View style={styles.notificationDot} />}
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Search color="#96A9BE" size={20} />
          <TextInput value={query} onChangeText={setQuery} placeholder={t.homeSearchPlaceholder} placeholderTextColor="#8EA1B5" style={styles.searchInput} onSubmitEditing={handleSearchSubmit} returnKeyType="search" />
        </View>

        <LinearGradient colors={['#385F8C', '#213E63']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroOrb} />
          <Text style={styles.arabicHero}>وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ</Text>
          <Text style={styles.heroTitle}>{t.homeHeroTitle}</Text>
          <Text style={styles.heroText}>{t.homeHeroText}</Text>
          <Pressable style={({ pressed }) => [styles.heroButton, pressed && styles.heroButtonPressed]} onPress={() => router.push('/duas')}>
            <Text style={styles.heroButtonText}>{t.homeHeroButton}</Text>
            <ChevronRight color="#0A1C31" size={18} />
          </Pressable>
        </LinearGradient>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t.homeQuickAccess}</Text>
          <Sparkles color="#A9F06B" size={18} />
        </View>
        <View style={styles.categoryRow}>
          {filteredCategories.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.title} style={({ pressed }) => [styles.categoryCard, pressed && styles.cardPressed]} onPress={() => router.push(item.href)}>
                <View style={[styles.categoryIcon, { backgroundColor: item.color }]}><Icon color="#112A42" size={20} strokeWidth={2.2} /></View>
                <Text style={styles.categoryTitle}>{item.title}</Text>
                <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>{t.homePrayerToday}</Text>
            <Text style={styles.sectionCaption}>{cityLabel} · {methodLabel}</Text>
          </View>
          <Pressable onPress={() => setShowNotifications(true)}><Text style={styles.linkText}>{t.homePrayerAll}</Text></Pressable>
        </View>

        {prayerError ? (
          <View style={styles.errorBar}>
            <TriangleAlert color="#F0C96B" size={15} />
            <Text style={styles.errorText}>{lang === 'ky' ? 'Намаз убактысы жаңырган жок, көрсөтүлгөн маалымат акыркы жүктөлгөн' : 'Не удалось обновить время намаза, показаны последние данные'}</Text>
          </View>
        ) : null}

        {prayerLoading ? (
          <View style={styles.prayerLoadingBar}>
            <Text style={styles.prayerLoadingText}>{t.homePrayerLoading}</Text>
          </View>
        ) : countdown.name ? (
          <View style={styles.countdownBar}>
            <Clock3 color="#A9F06B" size={16} />
            <Text style={styles.countdownText}>{t.homeCountdown} {countdown.name}: {countdown.hours}{t.homeHoursShort} {countdown.minutes}{t.homeMinutesShort}</Text>
          </View>
        ) : null}

        <View style={styles.prayerCard}>
          {timings.map((prayer, index) => {
            const active = index === currentPrayerIndex;
            return (
              <View key={`${prayer.name}-${index}`} style={[styles.prayerRow, active && styles.activePrayer]}>
                <View style={[styles.prayerMark, active && styles.activeMark]} />
                <Text style={[styles.prayerName, active && styles.activePrayerText]}>{prayer.name}</Text>
                <View style={styles.prayerTimeWrap}>
                  <Clock3 color={active ? '#A9F06B' : '#71869D'} size={15} />
                  <Text style={[styles.prayerTime, active && styles.activePrayerText]}>{prayer.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t.homeDuaOfDay}</Text>
          <Pressable onPress={() => toggleFavorite(duaOfTheDay.slug)} style={styles.likeButton}>
            <Heart color={isFavorite ? '#F58B8B' : '#9BAEC1'} fill={isFavorite ? '#F58B8B' : 'transparent'} size={18} />
          </Pressable>
        </View>
        <Pressable style={({ pressed }) => [styles.quoteCard, pressed && styles.quotePressed]} onPress={() => router.push({ pathname: '/duas', params: { q: duaOfTheDay.title } })}>
          <Text style={styles.quoteArabic} numberOfLines={2}>{duaOfTheDay.arabic}</Text>
          <Text style={styles.quoteTranslation} numberOfLines={3}>{duaOfTheDay.translation}</Text>
          <Text style={styles.quoteSource}>{duaOfTheDay.source || duaOfTheDay.title}</Text>
        </Pressable>

        {nameOfDay ? (
          <Pressable style={({ pressed }) => [styles.asmaCard, pressed && styles.quotePressed]} onPress={() => router.push('/asma' as never)}>
            <View style={styles.asmaIcon}>
              <Sparkles color="#0A1C31" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.asmaLabel}>{t.homeAsmaCardTitle}</Text>
              <Text style={styles.asmaName}>{nameOfDay.transliteration} · {nameOfDay.name}</Text>
            </View>
            <ChevronRight color="#0A1C31" size={20} />
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.homeModalTitle}</Text>
              <Pressable onPress={() => setShowNotifications(false)} hitSlop={12}><X color="#94A9BE" size={22} /></Pressable>
            </View>
            <Text style={styles.modalLabel}>{t.homeModalCity}</Text>
            <View style={styles.cityGrid}>
              <Pressable style={[styles.cityChip, styles.cityChipGps, isGpsCity && styles.activeCityChip]} onPress={() => setSettings((prev) => ({ ...prev, city: GPS_CITY }))}>
                <LocateFixed color={isGpsCity ? '#0A1C31' : '#94A9BE'} size={14} />
                <Text style={[styles.cityChipText, isGpsCity && styles.activeCityChipText]}>{t.cityGpsOption}</Text>
              </Pressable>
              {cityNames.map((city) => (
                <Pressable key={city} style={[styles.cityChip, settings.city === city && styles.activeCityChip]} onPress={() => setSettings((prev) => ({ ...prev, city }))}>
                  <Text style={[styles.cityChipText, settings.city === city && styles.activeCityChipText]}>{city}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.toggleRow} onPress={() => setSettings((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}>
              <Text style={styles.toggleLabel}>{t.homeModalToggle}</Text>
              <View style={[styles.toggle, settings.notificationsEnabled && styles.toggleOn]}>
                <View style={[styles.toggleKnob, settings.notificationsEnabled && styles.toggleKnobOn]} />
              </View>
            </Pressable>
            <Text style={styles.modalHint}>{t.homeModalHint}</Text>
            <Pressable style={styles.modalButton} onPress={() => setShowNotifications(false)}>
              <Text style={styles.modalButtonText}>{t.homeModalDone}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { padding: 24, paddingTop: 58, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  greeting: { color: '#F4F8FC', fontSize: 29, fontWeight: '700', marginTop: 8 },
  date: { color: '#94A9BE', fontSize: 13, marginTop: 6 },
  iconButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: '#31506D', backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#A9F06B', top: 9, right: 10 },
  searchBox: { marginTop: 26, height: 52, borderRadius: 18, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  searchInput: { flex: 1, color: '#F4F8FC', marginLeft: 11, fontSize: 14 },
  heroCard: { marginTop: 20, minHeight: 190, borderRadius: 26, padding: 24, overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(169,240,107,0.12)', right: -58, top: -52 },
  arabicHero: { color: '#E8F6D8', fontSize: 25, textAlign: 'right', marginBottom: 14 },
  heroTitle: { color: '#F7FBFF', fontSize: 21, fontWeight: '700' },
  heroText: { color: '#C1D1E1', fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 240 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#A9F06B', borderRadius: 13, paddingVertical: 10, paddingHorizontal: 15, marginTop: 17, gap: 6 },
  heroButtonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  heroButtonText: { color: '#0A1C31', fontWeight: '700', fontSize: 13 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 13 },
  sectionTitle: { color: '#F4F8FC', fontSize: 19, fontWeight: '700' },
  sectionCaption: { color: '#849AAF', fontSize: 12, marginTop: 4 },
  linkText: { color: '#A9F06B', fontSize: 13, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: { width: '48%', backgroundColor: '#10243C', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#203D5A' },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  categoryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryArabic: { color: '#112A42', fontWeight: '700', fontSize: 12 },
  categoryTitle: { color: '#F4F8FC', fontWeight: '700', fontSize: 14 },
  categorySubtitle: { color: '#8298AE', fontSize: 11, marginTop: 3 },
  errorBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3A2E1A', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  errorText: { color: '#E8CE9A', fontSize: 12, flex: 1, lineHeight: 17 },
  prayerLoadingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A3A52', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  prayerLoadingText: { color: '#849AAF', fontSize: 13 },
  countdownBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A3A52', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  countdownText: { color: '#A9F06B', fontSize: 13, fontWeight: '600' },
  prayerCard: { backgroundColor: '#10243C', borderRadius: 20, paddingVertical: 7, borderWidth: 1, borderColor: '#203D5A' },
  prayerRow: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 14, marginHorizontal: 7 },
  activePrayer: { backgroundColor: '#234D52' },
  prayerMark: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#50677D', marginRight: 12 },
  activeMark: { backgroundColor: '#A9F06B' },
  prayerName: { flex: 1, color: '#B4C3D2', fontSize: 14 },
  prayerTimeWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  prayerTime: { color: '#EAF2F8', fontSize: 14, fontWeight: '700' },
  activePrayerText: { color: '#F4FFF0' },
  likeButton: { padding: 8, backgroundColor: '#10243C', borderRadius: 12 },
  quoteCard: { backgroundColor: '#F2F6F5', borderRadius: 22, padding: 22, alignItems: 'center' },
  quotePressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  quoteArabic: { color: '#183952', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  quoteTranslation: { color: '#30485B', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 15 },
  quoteSource: { color: '#78909F', fontSize: 12, marginTop: 9 },
  asmaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#A9F06B', borderRadius: 18, padding: 16, marginTop: 12 },
  asmaIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(10,28,49,0.15)', alignItems: 'center', justifyContent: 'center' },
  asmaLabel: { color: '#254024', fontSize: 11, fontWeight: '700' },
  asmaName: { color: '#0A1C31', fontSize: 15, fontWeight: '700', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#10243C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: '#24415F' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#F4F8FC', fontSize: 20, fontWeight: '700' },
  modalLabel: { color: '#849AAF', fontSize: 12, marginBottom: 10 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765' },
  cityChipGps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeCityChip: { backgroundColor: '#A9F06B', borderColor: '#A9F06B' },
  cityChipText: { color: '#94A9BE', fontSize: 13, fontWeight: '600' },
  activeCityChipText: { color: '#0A1C31', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingVertical: 6 },
  toggleLabel: { color: '#D9E4EE', fontSize: 15 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#294765', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#A9F06B' },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#EAF2F8' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  modalHint: { color: '#72889C', fontSize: 12, lineHeight: 18, marginTop: 18 },
  modalButton: { backgroundColor: '#A9F06B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  modalButtonText: { color: '#0A1C31', fontWeight: '700', fontSize: 15 },
});
