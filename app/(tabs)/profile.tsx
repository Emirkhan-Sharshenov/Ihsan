import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { BookOpen, ChevronRight, Clock3, Globe, Heart, Info, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrayerSettingsSheet } from '@/components/PrayerSettingsSheet';
import { BottomSheet, PrimaryButton } from '@/components/ui';
import { colors } from '@/constants/theme';
import { duas } from '@/data/duas';
import { surahs } from '@/data/surahs';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocationLabel } from '@/hooks/useLocationLabel';
import { useSurahFavorites } from '@/hooks/useQuranSurahs';
import { useTasbihCount } from '@/hooks/useTasbihCount';

type Sheet = 'duas' | 'surahs' | 'language' | 'prayer' | null;

export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<Sheet>(null);
  const { favorites, toggleFavorite } = useFavorites();
  const { favorites: favoriteSurahNumbers, toggleFavorite: toggleSurahFavorite } = useSurahFavorites();
  const { total } = useTasbihCount();
  const placeLabel = useLocationLabel();

  const favoriteDuas = duas.filter((d) => favorites.includes(d.slug));
  const favoriteSurahs = surahs.filter((s) => favoriteSurahNumbers.includes(s.number));

  const rows: { label: string; icon: typeof Heart; onPress: () => void; badge?: string }[] = [
    { label: t.profilePrayerSettingsRow, icon: Clock3, onPress: () => setSheet('prayer'), badge: placeLabel },
    { label: t.profileFavDuasRow, icon: Heart, onPress: () => setSheet('duas'), badge: favoriteDuas.length ? String(favoriteDuas.length) : undefined },
    { label: t.profileFavSurahsRow, icon: BookOpen, onPress: () => setSheet('surahs'), badge: favoriteSurahs.length ? String(favoriteSurahs.length) : undefined },
    { label: t.profileAsmaRow, icon: Sparkles, onPress: () => router.push('/asma') },
    { label: t.profileLanguage, icon: Globe, onPress: () => setSheet('language'), badge: lang === 'ky' ? t.languageKy : t.languageRu },
    { label: t.profileAbout, icon: Info, onPress: () => router.push('/about') },
    { label: t.profilePrivacy, icon: ShieldCheck, onPress: () => router.push({ pathname: '/about', params: { section: 'privacy' } }) },
  ];

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', colors.bg]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t.profileEyebrow}</Text>
        <Text style={styles.title}>{t.profileTitle}</Text>
        <View style={styles.profileCard}>
          <Text style={styles.greeting}>{t.profileGreeting}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat value={favoriteDuas.length} label={t.profileFavDuas} />
          <Stat value={favoriteSurahs.length} label={t.profileFavSurahs} />
          <Stat value={total} label={t.profileTasbihTotal} />
        </View>

        <Text style={styles.section}>{t.profileSection}</Text>
        {rows.map(({ label, icon: Icon, onPress, badge }) => (
          <Pressable key={label} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]} onPress={onPress} accessibilityRole="button">
            <View style={styles.icon}>
              <Icon color={colors.accent} size={18} />
            </View>
            <Text style={styles.label}>{label}</Text>
            {badge ? (
              <Text style={styles.badgeText} numberOfLines={1}>
                {badge}
              </Text>
            ) : null}
            <ChevronRight color="#7890A6" size={18} />
          </Pressable>
        ))}

        <Text style={styles.version}>
          {t.profileVersion} {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <PrayerSettingsSheet visible={sheet === 'prayer'} onClose={() => setSheet(null)} />

      <BottomSheet visible={sheet === 'duas'} title={t.profileFavDuasRow} onClose={() => setSheet(null)}>
        {favoriteDuas.length === 0 ? <Text style={styles.emptyText}>{t.profileEmptyFavorites}</Text> : null}
        {favoriteDuas.map((d) => (
          <Pressable
            key={d.slug}
            style={styles.favRow}
            onPress={() => {
              setSheet(null);
              router.push({ pathname: '/duas', params: { open: d.slug } });
            }}
          >
            <Text style={styles.favTitle}>{d.title}</Text>
            <Pressable onPress={() => toggleFavorite(d.slug)} hitSlop={10}>
              <Heart color={colors.heart} fill={colors.heart} size={18} />
            </Pressable>
          </Pressable>
        ))}
        <PrimaryButton
          label={t.profileGoToDuas}
          onPress={() => {
            setSheet(null);
            router.push('/duas');
          }}
        />
      </BottomSheet>

      <BottomSheet visible={sheet === 'surahs'} title={t.profileFavSurahsRow} onClose={() => setSheet(null)}>
        {favoriteSurahs.length === 0 ? <Text style={styles.emptyText}>{t.profileEmptyFavSurahs}</Text> : null}
        {favoriteSurahs.map((s) => (
          <View key={s.number} style={styles.favRow}>
            <Text style={styles.favTitle}>
              {s.number}. {s.englishName}
              {lang === 'ru' ? ` · ${s.nameRu}` : ''}
            </Text>
            <Pressable onPress={() => toggleSurahFavorite(s.number)} hitSlop={10}>
              <BookOpen color={colors.accent} size={18} />
            </Pressable>
          </View>
        ))}
        <PrimaryButton
          label={t.profileGoToQuran}
          onPress={() => {
            setSheet(null);
            router.push('/quran');
          }}
        />
      </BottomSheet>

      <BottomSheet visible={sheet === 'language'} title={t.profileLanguage} onClose={() => setSheet(null)}>
        {(['ru', 'ky'] as const).map((code) => (
          <Pressable
            key={code}
            style={[styles.langRow, lang === code && styles.activeLangRow]}
            onPress={() => {
              setLang(code);
              setSheet(null);
            }}
          >
            <Text style={[styles.langText, lang === code && styles.activeLangText]}>{code === 'ru' ? t.languageRu : t.languageKy}</Text>
            {lang === code ? <Text style={styles.langCheck}>✓</Text> : null}
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value.toLocaleString('ru-RU')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 9 },
  profileCard: { backgroundColor: colors.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#294765', marginTop: 22 },
  greeting: { color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: 'center' },
  statNumber: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#8298AE', fontSize: 11, marginTop: 4, textAlign: 'center' },
  section: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 9 },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: '#D9E4EE', fontSize: 14, marginLeft: 12 },
  badgeText: { color: colors.accent, fontSize: 12, fontWeight: '600', marginHorizontal: 8, maxWidth: 110 },
  version: { color: colors.textMutedDark, fontSize: 12, textAlign: 'center', marginTop: 18 },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 6 },
  favRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  favTitle: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, backgroundColor: colors.cardAlt, borderRadius: 14, borderWidth: 1, borderColor: '#294765', marginBottom: 10 },
  activeLangRow: { backgroundColor: '#1A3D2E', borderColor: colors.accent },
  langText: { color: '#D9E4EE', fontSize: 16 },
  activeLangText: { color: colors.accent, fontWeight: '700' },
  langCheck: { color: colors.accent, fontSize: 18, fontWeight: '700' },
});
