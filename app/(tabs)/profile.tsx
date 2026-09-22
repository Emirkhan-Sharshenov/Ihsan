import { useState } from 'react';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { BellRing, Bookmark, BookOpen, ChevronRight, Heart, Info, Languages, Share2, ShieldCheck, Sparkles, Star, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrayerSettingsSheet } from '@/components/PrayerSettingsSheet';
import { BottomSheet, Card, Pill, PrimaryButton, ScreenBackground, ScreenHeader, type } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { duas } from '@/data/duas';
import { surahs } from '@/data/surahs';
import { methodName } from '@/data/translations';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocationLabel } from '@/hooks/useLocationLabel';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSurahFavorites } from '@/hooks/useQuranSurahs';
import { useSettings } from '@/hooks/useSettings';
import { useTasbihCount } from '@/hooks/useTasbihCount';
import { shareText } from '@/lib/share';

type Sheet = 'duas' | 'surahs' | 'language' | 'prayer' | null;
type Row = { label: string; subtitle?: string; icon: LucideIcon; iconColor?: string; onPress: () => void; badge?: string; value?: string };

const PLAY_URL = 'https://play.google.com/store/apps/details?id=kg.emirkhan.ihsan';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<Sheet>(null);
  const { favorites, toggleFavorite } = useFavorites();
  const { favorites: favoriteSurahNumbers, toggleFavorite: toggleSurahFavorite } = useSurahFavorites();
  const { total } = useTasbihCount();
  const [settings] = useSettings();
  const { method, official } = usePrayerTimes();
  const placeLabel = useLocationLabel();

  const favoriteDuas = duas.filter((d) => favorites.includes(d.slug));
  const favoriteSurahs = surahs.filter((s) => favoriteSurahNumbers.includes(s.number));
  const madhabShort = settings.madhab === 'hanafi' ? t.madhabShortHanafi : t.madhabShortShafi;

  const settingsRows: Row[] = [
    {
      label: t.profilePrayerSettingsRow,
      subtitle: `${placeLabel} · ${official ? t.homeSourceOfficial : methodName(t, method)} · ${madhabShort}`,
      icon: BellRing,
      iconColor: colors.accent,
      onPress: () => setSheet('prayer'),
    },
    { label: t.profileFavDuasRow, icon: Heart, iconColor: colors.heart, onPress: () => setSheet('duas'), badge: favoriteDuas.length ? String(favoriteDuas.length) : undefined },
    { label: t.profileFavSurahsRow, icon: Bookmark, onPress: () => setSheet('surahs'), badge: favoriteSurahs.length ? String(favoriteSurahs.length) : undefined },
    { label: t.profileAsmaRow, subtitle: t.profileAsmaSub, icon: Sparkles, onPress: () => router.push('/asma') },
    { label: t.profileLanguage, icon: Languages, onPress: () => setSheet('language'), value: lang === 'ky' ? t.languageKy : t.languageRu },
  ];
  const projectRows: Row[] = [
    { label: t.profileAbout, subtitle: t.profileAboutSub, icon: Info, onPress: () => router.push('/about') },
    { label: t.profilePrivacy, subtitle: t.profilePrivacySub, icon: ShieldCheck, onPress: () => router.push({ pathname: '/about', params: { section: 'privacy' } }) },
  ];

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.profileTitle} />

        <Card style={styles.blessingCard}>
          <Pill label={`★ ${t.profileBlessingBadge}`} />
          <Text style={styles.blessingTitle}>{t.profileGreeting}</Text>
          <Text style={type.muted}>{t.profileBlessingText}</Text>
        </Card>

        <View style={styles.statsRow}>
          <Stat icon={Heart} iconColor={colors.heart} value={favoriteDuas.length} label={t.profileFavDuas} />
          <Stat icon={BookOpen} value={favoriteSurahs.length} label={t.profileFavSurahs} />
          <Stat icon={Star} value={total} label={t.profileTasbihTotal} />
        </View>

        <Text style={styles.section}>{t.profileSettingsSection}</Text>
        <RowGroup rows={settingsRows} />

        <Text style={styles.section}>{t.profileProjectSection}</Text>
        <RowGroup rows={projectRows} />

        <PrimaryButton
          label={t.profileShare}
          onPress={() => shareText(`${t.shareAppText}\n${PLAY_URL}`)}
          icon={<Share2 color={colors.accentDark} size={18} />}
          style={{ marginTop: 24 }}
        />

        <Text style={styles.version}>
          {'Ихсан'} · {t.profileVersion} {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <PrayerSettingsSheet visible={sheet === 'prayer'} onClose={() => setSheet(null)} />

      <BottomSheet visible={sheet === 'duas'} title={t.profileFavDuasRow} onClose={() => setSheet(null)}>
        {favoriteDuas.length === 0 ? <Text style={[type.muted, { marginBottom: 6 }]}>{t.profileEmptyFavorites}</Text> : null}
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
        {favoriteSurahs.length === 0 ? <Text style={[type.muted, { marginBottom: 6 }]}>{t.profileEmptyFavSurahs}</Text> : null}
        {favoriteSurahs.map((s) => (
          <View key={s.number} style={styles.favRow}>
            <Text style={styles.favTitle}>
              {s.number}. {s.englishName}
              {lang === 'ru' ? ` · ${s.nameRu}` : ''}
            </Text>
            <Pressable onPress={() => toggleSurahFavorite(s.number)} hitSlop={10}>
              <Heart color={colors.heart} fill={colors.heart} size={18} />
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

function Stat({ icon: Icon, iconColor = colors.textMuted, value, label }: { icon: LucideIcon; iconColor?: string; value: number; label: string }) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon color={iconColor} size={16} />
      </View>
      <Text style={styles.statNumber}>{value.toLocaleString('ru-RU')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function RowGroup({ rows }: { rows: Row[] }) {
  return (
    <Card style={styles.group}>
      {rows.map(({ label, subtitle, icon: Icon, iconColor, onPress, badge, value }, i) => (
        <Pressable
          key={label}
          style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && { backgroundColor: colors.cardAlt }]}
          onPress={onPress}
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            <Icon color={iconColor ?? colors.text} size={19} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{label}</Text>
            {subtitle ? (
              <Text style={type.small} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          {value ? <Text style={type.muted}>{value}</Text> : null}
          <ChevronRight color={colors.textMuted} size={18} />
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  blessingCard: { gap: 10, padding: 20 },
  blessingTitle: { color: colors.text, fontSize: 24, lineHeight: 30, fontFamily: fonts.semibold },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statNumber: { color: colors.accent, fontSize: 22, fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textMuted, fontSize: 11, textAlign: 'center', fontFamily: fonts.regular },
  section: { color: colors.text, fontSize: 16, fontFamily: fonts.medium, marginTop: 26, marginBottom: 10, marginLeft: 4 },
  group: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.text, fontSize: 12, fontFamily: fonts.semibold },
  version: { color: colors.textMutedDark, fontSize: 12, textAlign: 'center', marginTop: 18, fontFamily: fonts.regular },
  favRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  favTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.medium, flex: 1 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  activeLangRow: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  langText: { color: colors.text, fontSize: 16, fontFamily: fonts.regular },
  activeLangText: { color: colors.accent, fontFamily: fonts.semibold },
  langCheck: { color: colors.accent, fontSize: 18, fontFamily: fonts.bold },
});
