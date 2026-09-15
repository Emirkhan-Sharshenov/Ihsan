import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, BookOpen, ChevronRight, Globe, Heart, LocateFixed, MapPin, Settings2, Sparkles, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '@/hooks/useFavorites';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuranSurahs } from '@/hooks/useQuranSurahs';
import { useSurahFavorites } from '@/hooks/useSurahFavorites';
import { cityNames, prayerSchedules, GPS_CITY } from '@/data/prayerTimes';
import duaData from './duas/dua_muslimclub.json';
import lifeSituationDuas from './duas/dua_life_situations.json';

type Dua = { slug: string; title: string; category: string; arabic: string; translation: string; source: string };
const allDuas = [...(duaData as Dua[]), ...(lifeSituationDuas as Dua[])];

type ModalType = 'favorites' | 'surahs' | 'notifications' | 'city' | 'language' | 'settings' | null;
type ItemAction = ModalType | { route: '/asma' };

export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<ModalType>(null);
  const { favorites, toggleFavorite } = useFavorites();
  const [settings, setSettings] = useSettings();
  const { surahs } = useQuranSurahs();
  const { favorites: favoriteSurahNumbers, toggleFavorite: toggleSurahFavorite } = useSurahFavorites();

  const favoriteDuas = allDuas.filter((d) => favorites.includes(d.slug));
  const favoriteSurahs = surahs.filter((s) => favoriteSurahNumbers.includes(s.number));
  const isGpsCity = settings.city === GPS_CITY;
  const cityBadge = isGpsCity ? t.cityGpsOption : settings.city;

  const items: { label: string; icon: typeof Heart; action: ItemAction; badge?: string | number }[] = [
    { label: t.profileFavDuasRow, icon: Heart, action: 'favorites', badge: favorites.length || undefined },
    { label: t.profileFavSurahs, icon: BookOpen, action: 'surahs', badge: favoriteSurahNumbers.length || undefined },
    { label: t.profileAsmaRow, icon: Sparkles, action: { route: '/asma' } },
    { label: t.profileNotificationsRow, icon: Bell, action: 'notifications', badge: settings.notificationsEnabled ? (lang === 'ky' ? 'Күйүк' : 'Вкл') : (lang === 'ky' ? 'Өчүк' : 'Выкл') },
    { label: t.profileCityRow, icon: MapPin, action: 'city', badge: cityBadge },
    { label: t.profileLanguage, icon: Globe, action: 'language', badge: lang === 'ky' ? 'Кыргызча' : 'Русский' },
    { label: t.profileSettingsRow, icon: Settings2, action: 'settings' },
  ];

  const methodLabel = (city: string) => {
    if (city === GPS_CITY) return t.cityGpsMethod;
    const sched = prayerSchedules[city];
    if (!sched) return '';
    return lang === 'ky' ? sched.methodKy : sched.method;
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', '#071526']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t.profileEyebrow}</Text>
        <Text style={styles.title}>{t.profileTitle}</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>م</Text></View>
          <View>
            <Text style={styles.name}>{t.profileName}</Text>
            <Text style={styles.sub}>{t.profileSub}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{favoriteDuas.length}</Text>
            <Text style={styles.statLabel}>{t.profileFavDuas}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{favoriteSurahNumbers.length}</Text>
            <Text style={styles.statLabel}>{t.profileFavSurahs}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{settings.tasbihGoal}</Text>
            <Text style={styles.statLabel}>{t.profileTasbihGoal}</Text>
          </View>
        </View>

        <Text style={styles.section}>{t.profileSettings}</Text>
        {items.map(({ label, icon: Icon, action, badge }) => (
          <Pressable
            key={label}
            style={styles.row}
            onPress={() => (action !== null && typeof action === 'object' ? router.push(action.route as never) : setModal(action))}
          >
            <View style={styles.icon}><Icon color="#A9F06B" size={18} /></View>
            <Text style={styles.label}>{label}</Text>
            {badge !== undefined && badge !== 0 ? <Text style={styles.badgeText}>{badge}</Text> : null}
            <ChevronRight color="#7890A6" size={18} />
          </Pressable>
        ))}

        <Text style={styles.note}>{t.profileNote}</Text>
      </ScrollView>

      <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modal === 'favorites' ? t.profileModalFavorites : modal === 'surahs' ? t.profileFavSurahs : modal === 'notifications' ? t.profileModalNotifications : modal === 'city' ? t.profileModalCity : modal === 'language' ? t.profileLanguage : modal === 'settings' ? t.profileModalSettings : ''}
              </Text>
              <Pressable onPress={() => setModal(null)} hitSlop={12}><X color="#94A9BE" size={22} /></Pressable>
            </View>

            {modal === 'favorites' && (
              <ScrollView style={styles.modalScroll}>
                {favoriteDuas.length === 0 ? (
                  <Text style={styles.emptyText}>{t.profileEmptyFavorites}</Text>
                ) : (
                  favoriteDuas.map((d) => (
                    <View key={d.slug} style={styles.favRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.favTitle}>{d.title}</Text>
                        <Text style={styles.favCategory}>{d.category}</Text>
                      </View>
                      <Pressable onPress={() => toggleFavorite(d.slug)} hitSlop={8}>
                        <Heart color="#F58B8B" fill="#F58B8B" size={18} />
                      </Pressable>
                    </View>
                  ))
                )}
                <Pressable style={styles.modalButton} onPress={() => { setModal(null); router.push('/duas'); }}>
                  <Text style={styles.modalButtonText}>{t.profileGoToDuas}</Text>
                </Pressable>
              </ScrollView>
            )}

            {modal === 'surahs' && (
              <ScrollView style={styles.modalScroll}>
                {favoriteSurahs.length === 0 ? (
                  <Text style={styles.emptyText}>{t.profileEmptyFavSurahs}</Text>
                ) : (
                  favoriteSurahs.map((s) => (
                    <View key={s.number} style={styles.favRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.favTitle}>{s.number}. {s.englishName}</Text>
                        <Text style={styles.favCategory}>{s.englishNameTranslation} · {s.numberOfAyahs} {t.quranAyahsShort}</Text>
                      </View>
                      <Pressable onPress={() => toggleSurahFavorite(s.number)} hitSlop={8}>
                        <BookOpen color="#A9F06B" size={18} />
                      </Pressable>
                    </View>
                  ))
                )}
                <Pressable style={styles.modalButton} onPress={() => { setModal(null); router.push('/quran'); }}>
                  <Text style={styles.modalButtonText}>{t.profileGoToQuran}</Text>
                </Pressable>
              </ScrollView>
            )}

            {modal === 'notifications' && (
              <>
                <Pressable style={styles.toggleRow} onPress={() => setSettings((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}>
                  <Text style={styles.toggleLabel}>{t.profileNotifyToggle}</Text>
                  <View style={[styles.toggle, settings.notificationsEnabled && styles.toggleOn]}>
                    <View style={[styles.toggleKnob, settings.notificationsEnabled && styles.toggleKnobOn]} />
                  </View>
                </Pressable>
                <Text style={styles.modalHint}>{t.profileNotifyHint}</Text>
                <Pressable style={styles.modalButton} onPress={() => setModal(null)}>
                  <Text style={styles.modalButtonText}>{t.homeModalDone}</Text>
                </Pressable>
              </>
            )}

            {modal === 'city' && (
              <>
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
                <Text style={styles.modalHint}>{t.profileMethod}: {methodLabel(settings.city)}</Text>
                <Pressable style={styles.modalButton} onPress={() => setModal(null)}>
                  <Text style={styles.modalButtonText}>{t.homeModalDone}</Text>
                </Pressable>
              </>
            )}

            {modal === 'language' && (
              <>
                <Pressable style={[styles.langRow, lang === 'ru' && styles.activeLangRow]} onPress={() => { setLang('ru'); setModal(null); }}>
                  <Text style={[styles.langText, lang === 'ru' && styles.activeLangText]}>Русский</Text>
                  {lang === 'ru' && <Text style={styles.langCheck}>✓</Text>}
                </Pressable>
                <Pressable style={[styles.langRow, lang === 'ky' && styles.activeLangRow]} onPress={() => { setLang('ky'); setModal(null); }}>
                  <Text style={[styles.langText, lang === 'ky' && styles.activeLangText]}>Кыргызча</Text>
                  {lang === 'ky' && <Text style={styles.langCheck}>✓</Text>}
                </Pressable>
              </>
            )}

            {modal === 'settings' && (
              <>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t.profileDarkTheme}</Text>
                  <Text style={styles.settingValue}>{t.profileAlwaysOn}</Text>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t.profileLanguage}</Text>
                  <Text style={styles.settingValue}>{lang === 'ky' ? 'Кыргызча' : 'Русский'}</Text>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t.profileVersion}</Text>
                  <Text style={styles.settingValue}>1.0.0</Text>
                </View>

                <Text style={styles.settingsSubHeading}>{t.profileMadhab}</Text>
                <Text style={styles.settingsHint}>{t.profileMadhabNote}</Text>
                <View style={styles.madhabRow}>
                  <Pressable
                    style={[styles.madhabOption, settings.madhab === 'hanafi' && styles.madhabOptionActive]}
                    onPress={() => setSettings((prev) => ({ ...prev, madhab: 'hanafi' }))}
                  >
                    <Text style={[styles.madhabOptionText, settings.madhab === 'hanafi' && styles.madhabOptionTextActive]}>{t.madhabHanafi}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.madhabOption, settings.madhab === 'shafi' && styles.madhabOptionActive]}
                    onPress={() => setSettings((prev) => ({ ...prev, madhab: 'shafi' }))}
                  >
                    <Text style={[styles.madhabOptionText, settings.madhab === 'shafi' && styles.madhabOptionTextActive]}>{t.madhabShafi}</Text>
                  </Pressable>
                </View>

                <Pressable style={styles.modalButton} onPress={() => setModal(null)}>
                  <Text style={styles.modalButtonText}>{t.homeModalDone}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 32 },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#F4F8FC', fontSize: 30, fontWeight: '700', marginTop: 9 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10243C', borderRadius: 22, padding: 19, borderWidth: 1, borderColor: '#294765', marginTop: 25 },
  avatar: { width: 55, height: 55, borderRadius: 19, backgroundColor: '#D7F3BE', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { color: '#214432', fontSize: 26, fontWeight: '700' },
  name: { color: '#F4F8FC', fontSize: 18, fontWeight: '700' },
  sub: { color: '#869CAF', fontSize: 11, marginTop: 5, maxWidth: 210 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: '#10243C', borderRadius: 16, borderWidth: 1, borderColor: '#203D5A', padding: 16, alignItems: 'center' },
  statNumber: { color: '#A9F06B', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#8298AE', fontSize: 11, marginTop: 4, textAlign: 'center' },
  section: { color: '#F4F8FC', fontSize: 19, fontWeight: '700', marginTop: 30, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10243C', borderRadius: 17, borderWidth: 1, borderColor: '#203D5A', padding: 14, marginBottom: 9 },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: '#D9E4EE', fontSize: 14, marginLeft: 12 },
  badgeText: { color: '#A9F06B', fontSize: 12, fontWeight: '600', marginRight: 8 },
  note: { color: '#72889C', fontSize: 12, lineHeight: 19, marginTop: 25, paddingHorizontal: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#10243C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: '#24415F', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#F4F8FC', fontSize: 20, fontWeight: '700' },
  modalScroll: { maxHeight: 400 },
  emptyText: { color: '#849AAF', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  favRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#203D5A' },
  favTitle: { color: '#F4F8FC', fontSize: 15, fontWeight: '600' },
  favCategory: { color: '#8298AE', fontSize: 11, marginTop: 3 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  toggleLabel: { color: '#D9E4EE', fontSize: 15 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#294765', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#A9F06B' },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#EAF2F8' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  modalHint: { color: '#72889C', fontSize: 12, lineHeight: 18, marginTop: 18 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765' },
  cityChipGps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeCityChip: { backgroundColor: '#A9F06B', borderColor: '#A9F06B' },
  cityChipText: { color: '#94A9BE', fontSize: 13, fontWeight: '600' },
  activeCityChipText: { color: '#0A1C31', fontWeight: '700' },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14, backgroundColor: '#122B46', borderRadius: 14, borderWidth: 1, borderColor: '#294765', marginBottom: 10 },
  activeLangRow: { backgroundColor: '#1A3D2E', borderColor: '#A9F06B' },
  langText: { color: '#D9E4EE', fontSize: 16 },
  activeLangText: { color: '#A9F06B', fontWeight: '700' },
  langCheck: { color: '#A9F06B', fontSize: 18, fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#203D5A' },
  settingsSubHeading: { color: '#F4F8FC', fontSize: 14, fontWeight: '700', marginTop: 18 },
  settingsHint: { color: '#72889C', fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  madhabRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  madhabOption: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#294765', paddingVertical: 13, alignItems: 'center' },
  madhabOptionActive: { backgroundColor: '#A9F06B', borderColor: '#A9F06B' },
  madhabOptionText: { color: '#D9E4EE', fontSize: 13, fontWeight: '600' },
  madhabOptionTextActive: { color: '#0A1C31' },
  settingLabel: { color: '#D9E4EE', fontSize: 15 },
  settingValue: { color: '#8298AE', fontSize: 14 },
  modalButton: { backgroundColor: '#A9F06B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  modalButtonText: { color: '#0A1C31', fontWeight: '700', fontSize: 15 },
});
