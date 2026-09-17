import { useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, ChevronRight, Pause, Play, RefreshCw, Search, Star, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, type ViewToken } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toggle } from '@/components/ui';
import { colors } from '@/constants/theme';
import { sajdaLabel } from '@/data/sajdaLocations';
import { surahs, type Surah } from '@/data/surahs';
import type { Lang, TranslationKeys } from '@/data/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useLastRead, useSurahDetail, useSurahFavorites } from '@/hooks/useQuranSurahs';
import { useSettings } from '@/hooks/useSettings';

const RECITER_EDITION = 'ar.alafasy';
const audioUrlForAyah = (globalAyahNumber: number) => `https://cdn.islamic.network/quran/audio/128/${RECITER_EDITION}/${globalAyahNumber}.mp3`;
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

export default function QuranScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useSurahFavorites();
  const [lastRead, setLastRead] = useLastRead();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<{ surah: Surah; startAyah: number } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[-'‘’\s]/g, '');
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === q ||
        s.englishName.toLowerCase().replace(/[-'‘’\s]/g, '').includes(q) ||
        s.nameRu.toLowerCase().replace(/[-\s]/g, '').includes(q) ||
        s.name.includes(query.trim()),
    );
  }, [query]);

  const lastReadSurah = lastRead ? surahs.find((s) => s.number === lastRead.surahNumber) : null;

  const openSurah = (surah: Surah, startAyah = 1) => {
    setActive({ surah, startAyah });
    if (!lastRead || lastRead.surahNumber !== surah.number) setLastRead({ surahNumber: surah.number, ayahNumber: startAyah });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', colors.bg]} style={StyleSheet.absoluteFill} />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.number)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>{t.quranEyebrow}</Text>
            <Text style={styles.title}>{t.quranTitle}</Text>
            <View style={styles.searchBox}>
              <Search color="#96A9BE" size={19} />
              <TextInput value={query} onChangeText={setQuery} placeholder={t.quranSearchPlaceholder} placeholderTextColor="#8EA1B5" style={styles.input} />
            </View>
            {lastReadSurah && lastRead && !query ? (
              <Pressable style={styles.continueCard} onPress={() => openSurah(lastReadSurah, lastRead.ayahNumber)}>
                <View style={styles.continueIcon}>
                  <BookOpen color={colors.accentDark} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.continueLabel}>{t.quranContinueReading}</Text>
                  <Text style={styles.continueTitle}>
                    {lastReadSurah.number}. {lang === 'ru' ? lastReadSurah.nameRu : lastReadSurah.englishName} · {lastRead.ayahNumber}
                  </Text>
                </View>
                <ChevronRight color={colors.accentDark} size={20} />
              </Pressable>
            ) : null}
            <View style={{ height: 14 }} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.stateText}>{t.quranEmpty}</Text>}
        renderItem={({ item }) => {
          const isFavorite = favorites.includes(item.number);
          return (
            <Pressable style={styles.surahRow} onPress={() => openSurah(item)}>
              <View style={styles.surahNumber}>
                <Text style={styles.surahNumberText}>{item.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.surahName}>{item.englishName}</Text>
                <Text style={styles.surahMeta}>
                  {lang === 'ru' ? `${item.nameRu} · ` : ''}
                  {item.numberOfAyahs} {t.quranAyahsShort} · {item.revelationType === 'Meccan' ? t.quranMeccan : t.quranMedinan}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => toggleFavorite(item.number)} style={styles.starButton} accessibilityRole="button">
                <Star color={isFavorite ? '#F0C96B' : '#7890A6'} fill={isFavorite ? '#F0C96B' : 'transparent'} size={17} />
              </Pressable>
              <Text style={styles.surahArabic}>{item.name.replace(/^سُورَةُ\s*/, '')}</Text>
            </Pressable>
          );
        }}
      />

      <Modal visible={active !== null} animationType="slide" onRequestClose={() => setActive(null)} statusBarTranslucent>
        {active ? (
          <SurahReader
            key={`${active.surah.number}-${lang}`}
            surah={active.surah}
            startAyah={active.startAyah}
            lang={lang}
            t={t}
            isFavorite={favorites.includes(active.surah.number)}
            onToggleFavorite={() => toggleFavorite(active.surah.number)}
            onAyahVisible={(ayahNumber) => setLastRead({ surahNumber: active.surah.number, ayahNumber })}
            onClose={() => setActive(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function SurahReader({
  surah,
  startAyah,
  lang,
  t,
  isFavorite,
  onToggleFavorite,
  onAyahVisible,
  onClose,
}: {
  surah: Surah;
  startAyah: number;
  lang: Lang;
  t: TranslationKeys;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAyahVisible: (ayahNumber: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [settings] = useSettings();
  const { ayahs, loading, error, refresh } = useSurahDetail(surah.number, lang);
  const [showTranslit, setShowTranslit] = usePersistentState('@quran_show_translit', true);
  const [playing, setPlaying] = useState<{ index: number; autoplay: boolean } | null>(null);
  const [audioError, setAudioError] = useState(false);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const listRef = useRef<FlatList>(null);
  const scrolledToStart = useRef(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
  }, []);

  const startAyahAt = (index: number, autoplay: boolean) => {
    const ayah = ayahs[index];
    if (!ayah) return;
    setAudioError(false);
    player.replace({ uri: audioUrlForAyah(ayah.number) });
    player.play();
    setPlaying({ index, autoplay });
  };

  const stop = () => {
    player.pause();
    setPlaying(null);
  };

  const toggleAyah = (index: number) => {
    if (playing?.index === index) {
      if (status.playing) player.pause();
      else player.play();
      return;
    }
    startAyahAt(index, false);
  };

  useEffect(() => {
    if (!status.didJustFinish || !playing) return;
    if (playing.autoplay && ayahs[playing.index + 1]) {
      startAyahAt(playing.index + 1, true);
      listRef.current?.scrollToIndex({ index: playing.index + 1, animated: true, viewPosition: 0.2 });
    } else {
      setPlaying(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  // Audio streams from the CDN; if it has not loaded after a while, most likely there is no internet.
  useEffect(() => {
    if (!playing || status.isLoaded) return;
    const timer = setTimeout(() => setAudioError(true), 10000);
    return () => clearTimeout(timer);
  }, [playing, status.isLoaded]);

  useEffect(() => {
    if (!loading && ayahs.length > 0 && startAyah > 1 && !scrolledToStart.current) {
      scrolledToStart.current = true;
      setTimeout(() => listRef.current?.scrollToIndex({ index: Math.min(startAyah - 1, ayahs.length - 1), animated: false }), 50);
    }
  }, [loading, ayahs.length, startAyah]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable && v.item);
    if (first) onAyahVisible((first.item as { numberInSurah: number }).numberInSurah);
  }).current;

  return (
    <View style={styles.readerScreen}>
      <LinearGradient colors={['#102D49', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.readerHeader, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => {
            stop();
            onClose();
          }}
          hitSlop={12}
          style={styles.readerButton}
          accessibilityRole="button"
        >
          <X color="#EAF4FF" size={22} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.readerTitle}>
            {surah.number}. {surah.englishName}
          </Text>
          <Text style={styles.readerSubtitle}>{lang === 'ru' ? surah.nameRu : surah.name}</Text>
        </View>
        <Pressable onPress={onToggleFavorite} hitSlop={12} style={styles.readerButton} accessibilityRole="button">
          <Star color={isFavorite ? '#F0C96B' : '#EAF4FF'} fill={isFavorite ? '#F0C96B' : 'transparent'} size={20} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.stateText}>{t.quranAyahLoading}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.stateText}>{t.quranAyahError}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <RefreshCw color={colors.accentDark} size={16} />
            <Text style={styles.retryText}>{t.retry}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={ayahs}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={[styles.ayahListContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 200);
          }}
          ListHeaderComponent={
            <View>
              <Pressable style={styles.playSurahBar} onPress={() => (playing?.autoplay ? stop() : startAyahAt(0, true))}>
                {playing?.autoplay ? <Pause color={colors.accentDark} size={17} /> : <Play color={colors.accentDark} size={17} />}
                <Text style={styles.playSurahText}>{playing?.autoplay ? t.quranStopSurah : t.quranPlaySurah}</Text>
                <Text style={styles.reciterText}>{t.quranReciterName}</Text>
              </Pressable>
              {audioError ? <Text style={styles.audioError}>{t.quranAudioNeedsInternet}</Text> : null}
              <Pressable style={styles.translitToggle} onPress={() => setShowTranslit(!showTranslit)} accessibilityRole="switch">
                <Text style={styles.translitToggleText}>{t.quranShowTransliteration}</Text>
                <Toggle value={showTranslit} />
              </Pressable>
              <View style={styles.disclaimerBar}>
                <Text style={styles.disclaimerText}>
                  {t.quranTranslationSource}. {t.quranTransliterationNote}
                </Text>
              </View>
              {surah.number !== 1 && surah.number !== 9 ? <Text style={styles.basmala}>{BASMALA}</Text> : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const isActive = playing?.index === index;
            const isPlayingThis = isActive && status.playing;
            const sajda = sajdaLabel(item.number, settings.madhab, t);
            return (
              <View style={[styles.ayahCard, isActive && styles.ayahCardActive]}>
                <View style={styles.ayahTopRow}>
                  <View style={styles.ayahBadge}>
                    <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
                  </View>
                  <Pressable onPress={() => toggleAyah(index)} style={styles.ayahPlayButton} hitSlop={8} accessibilityRole="button">
                    {isPlayingThis ? <Pause color={colors.accentDark} size={15} /> : <Play color={colors.accentDark} size={15} />}
                  </Pressable>
                </View>
                <Text style={styles.ayahArabic}>{item.arabic}</Text>
                {sajda ? (
                  <View style={styles.sajdaBadge}>
                    <Text style={styles.sajdaBadgeText}>{sajda}</Text>
                  </View>
                ) : null}
                {showTranslit && item.transliteration ? (
                  <>
                    <Text style={styles.ayahLabel}>{t.quranTransliterationLabel}</Text>
                    <Text style={styles.ayahTransliteration}>{item.transliteration}</Text>
                  </>
                ) : null}
                {item.translation ? (
                  <>
                    <Text style={styles.ayahLabel}>{t.quranTranslationLabel}</Text>
                    <Text style={styles.ayahTranslation}>{item.translation}</Text>
                  </>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 24 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 9 },
  searchBox: { height: 50, borderRadius: 17, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 20 },
  input: { flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accent, borderRadius: 18, padding: 16, marginTop: 16 },
  continueIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(10,28,49,0.15)', alignItems: 'center', justifyContent: 'center' },
  continueLabel: { color: '#254024', fontSize: 11, fontWeight: '700' },
  continueTitle: { color: colors.accentDark, fontSize: 15, fontWeight: '700', marginTop: 2 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  stateText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18 },
  retryText: { color: colors.accentDark, fontWeight: '700', fontSize: 13 },
  surahRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 9, gap: 12 },
  surahNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  surahNumberText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  surahName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  surahMeta: { color: '#8298AE', fontSize: 11, marginTop: 4 },
  starButton: { padding: 4 },
  surahArabic: { color: colors.accentSoft, fontSize: 18, minWidth: 40, textAlign: 'right' },
  readerScreen: { flex: 1, backgroundColor: colors.bg },
  readerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 12 },
  readerButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  readerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  readerSubtitle: { color: colors.accent, fontSize: 14, marginTop: 2 },
  ayahListContent: { paddingHorizontal: 18 },
  playSurahBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16 },
  playSurahText: { color: colors.accentDark, fontWeight: '700', fontSize: 13 },
  reciterText: { color: '#254024', fontSize: 11, marginLeft: 'auto' },
  audioError: { color: '#E8CE9A', fontSize: 12, marginTop: 8, textAlign: 'center' },
  translitToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingVertical: 4 },
  translitToggleText: { color: '#D9E4EE', fontSize: 14 },
  disclaimerBar: { marginTop: 10, backgroundColor: '#1E2E1C', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2E4429' },
  disclaimerText: { color: '#A9C79A', fontSize: 11, lineHeight: 16 },
  basmala: { color: '#E9F5DE', fontSize: 26, textAlign: 'center', marginVertical: 18, writingDirection: 'rtl' },
  ayahCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 12 },
  ayahCardActive: { borderColor: colors.accent },
  ayahTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ayahPlayButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ayahBadge: { minWidth: 28, height: 28, paddingHorizontal: 6, borderRadius: 9, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  ayahBadgeText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  sajdaBadge: { backgroundColor: '#3A2E1A', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, marginTop: 10, borderWidth: 1, borderColor: '#5A4626' },
  sajdaBadgeText: { color: '#E8CE9A', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  ayahArabic: { color: '#E9F5DE', fontSize: 25, lineHeight: 48, textAlign: 'right', writingDirection: 'rtl' },
  ayahLabel: { color: '#6E9A80', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  ayahTransliteration: { color: '#C8D8E6', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  ayahTranslation: { color: '#D0DCE6', fontSize: 14, lineHeight: 21 },
});
