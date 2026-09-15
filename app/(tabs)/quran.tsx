import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, ChevronRight, Pause, Play, RefreshCw, Search, Star, X } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuranSurahs, useSurahDetail, type Surah } from '@/hooks/useQuranSurahs';
import { useLastRead, useSurahFavorites } from '@/hooks/useSurahFavorites';
import { sajdaByGlobalNumber } from '@/data/sajdaLocations';

const RECITER_EDITION = 'ar.alafasy';
const audioUrlForAyah = (globalAyahNumber: number) => `https://cdn.islamic.network/quran/audio/128/${RECITER_EDITION}/${globalAyahNumber}.mp3`;

export default function QuranScreen() {
  const { t, lang } = useLanguage();
  const { surahs, loading, error, refresh } = useQuranSurahs();
  const { favorites, toggleFavorite } = useSurahFavorites();
  const [lastRead, setLastRead] = useLastRead();
  const [query, setQuery] = useState('');
  const [activeSurah, setActiveSurah] = useState<Surah | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number).includes(q),
    );
  }, [surahs, query]);

  const openSurah = (surah: Surah) => {
    setActiveSurah(surah);
    setLastRead({ surahNumber: surah.number, surahName: surah.englishName, ayahNumber: 1 });
  };

  const lastReadSurah = lastRead ? surahs.find((s) => s.number === lastRead.surahNumber) : null;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', '#071526']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{t.quranEyebrow}</Text>
        <Text style={styles.title}>{t.quranTitle}</Text>

        <View style={styles.searchBox}>
          <Search color="#96A9BE" size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.quranSearchPlaceholder}
            placeholderTextColor="#8EA1B5"
            style={styles.input}
          />
        </View>

        {lastReadSurah && !query ? (
          <Pressable style={styles.continueCard} onPress={() => openSurah(lastReadSurah)}>
            <View style={styles.continueIcon}>
              <BookOpen color="#0A1C31" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.continueLabel}>{t.quranContinueReading}</Text>
              <Text style={styles.continueTitle}>{lastReadSurah.number}. {lastReadSurah.name}</Text>
            </View>
            <ChevronRight color="#0A1C31" size={20} />
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#A9F06B" />
            <Text style={styles.stateText}>{t.quranLoading}</Text>
          </View>
        ) : error && surahs.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.stateText}>{t.quranError}</Text>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <RefreshCw color="#0A1C31" size={16} />
              <Text style={styles.retryText}>{t.quranRetry}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => String(item.number)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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
                      {item.englishNameTranslation} · {item.numberOfAyahs} {t.quranAyahsShort} · {item.revelationType === 'Meccan' ? t.quranMeccan : t.quranMedinan}
                    </Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => toggleFavorite(item.number)} style={styles.starButton}>
                    <Star color={isFavorite ? '#F0C96B' : '#7890A6'} fill={isFavorite ? '#F0C96B' : 'transparent'} size={17} />
                  </Pressable>
                  <Text style={styles.surahArabic}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Modal visible={activeSurah !== null} animationType="slide" onRequestClose={() => setActiveSurah(null)}>
        {activeSurah ? (
          <SurahReader
            surah={activeSurah}
            lang={lang}
            t={t}
            isFavorite={favorites.includes(activeSurah.number)}
            onToggleFavorite={() => toggleFavorite(activeSurah.number)}
            onClose={() => setActiveSurah(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function SurahReader({
  surah,
  lang,
  t,
  isFavorite,
  onToggleFavorite,
  onClose,
}: {
  surah: Surah;
  lang: 'ru' | 'ky';
  t: ReturnType<typeof useLanguage>['t'];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}) {
  const { arabicAyahs, transliterationAyahs, translationAyahs, loading, error, refresh } = useSurahDetail(surah.number, lang);
  const [activeAyah, setActiveAyah] = useState<{ index: number; globalNumber: number } | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const player = useAudioPlayer(activeAyah ? audioUrlForAyah(activeAyah.globalNumber) : null);
  const status = useAudioPlayerStatus(player);

  const playAyah = (index: number) => {
    const ayah = arabicAyahs[index];
    if (!ayah) return;
    if (activeAyah?.index === index && status.playing) {
      player.pause();
      return;
    }
    setActiveAyah({ index, globalNumber: ayah.number });
  };

  const playSurahFromStart = () => {
    if (arabicAyahs.length === 0) return;
    setAutoPlay(true);
    setActiveAyah({ index: 0, globalNumber: arabicAyahs[0].number });
  };

  const stopPlayback = () => {
    setAutoPlay(false);
    player.pause();
    setActiveAyah(null);
  };

  useEffect(() => {
    if (activeAyah) player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAyah?.globalNumber]);

  useEffect(() => {
    if (!status.didJustFinish || activeAyah === null) return;
    const nextIndex = activeAyah.index + 1;
    if (autoPlay && arabicAyahs[nextIndex]) {
      setActiveAyah({ index: nextIndex, globalNumber: arabicAyahs[nextIndex].number });
    } else {
      setAutoPlay(false);
      setActiveAyah(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  return (
    <View style={styles.readerScreen}>
      <LinearGradient colors={['#102D49', '#071526']} style={StyleSheet.absoluteFill} />
      <View style={styles.readerHeader}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.readerClose}>
          <X color="#EAF4FF" size={22} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.readerTitle}>{surah.number}. {surah.englishName}</Text>
          <Text style={styles.readerSubtitle}>{surah.name}</Text>
        </View>
        <Pressable onPress={onToggleFavorite} hitSlop={12} style={styles.readerClose}>
          <Star color={isFavorite ? '#F0C96B' : '#EAF4FF'} fill={isFavorite ? '#F0C96B' : 'transparent'} size={20} />
        </Pressable>
      </View>

      {!loading && !error ? (
        <>
          <Pressable
            style={styles.playSurahBar}
            onPress={() => (autoPlay && activeAyah ? stopPlayback() : playSurahFromStart())}
          >
            {autoPlay && activeAyah ? <Pause color="#0A1C31" size={17} /> : <Play color="#0A1C31" size={17} />}
            <Text style={styles.playSurahText}>
              {autoPlay && activeAyah ? t.quranStopSurah : t.quranPlaySurah}
            </Text>
            <Text style={styles.reciterText}>{t.quranReciterName}</Text>
          </Pressable>
          <View style={styles.disclaimerBar}>
            <Text style={styles.disclaimerText}>{t.quranTransliterationNote}</Text>
          </View>
        </>
      ) : null}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#A9F06B" />
          <Text style={styles.stateText}>{t.quranAyahLoading}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.stateText}>{t.quranAyahError}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <RefreshCw color="#0A1C31" size={16} />
            <Text style={styles.retryText}>{t.quranRetry}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={arabicAyahs}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.ayahListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isActive = activeAyah?.index === index;
            const isPlayingThis = isActive && status.playing;
            const sajda = sajdaByGlobalNumber[item.number];
            return (
              <View style={[styles.ayahCard, isActive && styles.ayahCardActive]}>
                <View style={styles.ayahTopRow}>
                  <View style={styles.ayahBadge}>
                    <Text style={styles.ayahBadgeText}>{item.numberInSurah}</Text>
                  </View>
                  <Pressable onPress={() => playAyah(index)} style={styles.ayahPlayButton} hitSlop={8}>
                    {isPlayingThis ? <Pause color="#0A1C31" size={15} /> : <Play color="#0A1C31" size={15} />}
                  </Pressable>
                </View>
                <Text style={styles.ayahArabic}>{item.text}</Text>
                {sajda ? (
                  <View style={styles.sajdaBadge}>
                    <Text style={styles.sajdaBadgeText}>
                      {sajda.obligatory ? t.quranSajdaObligatory : t.quranSajdaRecommended}
                    </Text>
                  </View>
                ) : null}
                {transliterationAyahs[index] ? (
                  <>
                    <Text style={styles.ayahLabel}>{t.quranTransliterationLabel}</Text>
                    <Text style={styles.ayahTransliteration}>{transliterationAyahs[index].text}</Text>
                  </>
                ) : null}
                {translationAyahs[index] ? (
                  <>
                    <Text style={styles.ayahLabel}>{t.quranTranslationLabel}</Text>
                    <Text style={styles.ayahTranslation}>{translationAyahs[index].text}</Text>
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
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#F4F8FC', fontSize: 30, fontWeight: '700', marginTop: 9 },
  searchBox: { height: 50, borderRadius: 17, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 22 },
  input: { flex: 1, marginLeft: 10, color: '#F4F8FC', fontSize: 14 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#A9F06B', borderRadius: 18, padding: 16, marginTop: 16 },
  continueIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(10,28,49,0.15)', alignItems: 'center', justifyContent: 'center' },
  continueLabel: { color: '#254024', fontSize: 11, fontWeight: '700' },
  continueTitle: { color: '#0A1C31', fontSize: 15, fontWeight: '700', marginTop: 2 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40 },
  stateText: { color: '#849AAF', fontSize: 14, textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#A9F06B', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18 },
  retryText: { color: '#0A1C31', fontWeight: '700', fontSize: 13 },
  listContent: { paddingTop: 18, paddingBottom: 20 },
  surahRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10243C', borderRadius: 17, borderWidth: 1, borderColor: '#203D5A', padding: 14, marginBottom: 9, gap: 12 },
  surahNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  surahNumberText: { color: '#A9F06B', fontSize: 13, fontWeight: '700' },
  surahName: { color: '#F4F8FC', fontSize: 15, fontWeight: '700' },
  surahMeta: { color: '#8298AE', fontSize: 11, marginTop: 4 },
  starButton: { padding: 4 },
  surahArabic: { color: '#D7F3BE', fontSize: 17, minWidth: 40, textAlign: 'right' },
  readerScreen: { flex: 1, backgroundColor: '#071526' },
  readerHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 58, paddingHorizontal: 20, paddingBottom: 16 },
  readerClose: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  readerTitle: { color: '#F4F8FC', fontSize: 16, fontWeight: '700' },
  readerSubtitle: { color: '#A9F06B', fontSize: 15, marginTop: 2 },
  ayahListContent: { padding: 20, paddingBottom: 40 },
  ayahCard: { backgroundColor: '#10243C', borderRadius: 18, borderWidth: 1, borderColor: '#203D5A', padding: 18, marginBottom: 12 },
  ayahCardActive: { borderColor: '#A9F06B' },
  ayahTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ayahPlayButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#A9F06B', alignItems: 'center', justifyContent: 'center' },
  ayahBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  ayahBadgeText: { color: '#A9F06B', fontSize: 12, fontWeight: '700' },
  sajdaBadge: { alignSelf: 'flex-end', backgroundColor: '#3A2E1A', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10, marginTop: 8, borderWidth: 1, borderColor: '#5A4626' },
  sajdaBadgeText: { color: '#E8CE9A', fontSize: 11, fontWeight: '700' },
  ayahArabic: { color: '#E9F5DE', fontSize: 22, lineHeight: 40, textAlign: 'right' },
  ayahLabel: { color: '#5F8872', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  ayahTransliteration: { color: '#C8D8E6', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  ayahTranslation: { color: '#B8C8D6', fontSize: 13, lineHeight: 20 },
  playSurahBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#A9F06B', borderRadius: 14, marginHorizontal: 20, marginBottom: 10, paddingVertical: 12, paddingHorizontal: 16 },
  playSurahText: { color: '#0A1C31', fontWeight: '700', fontSize: 13 },
  reciterText: { color: '#254024', fontSize: 11, marginLeft: 'auto' },
  disclaimerBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4, backgroundColor: '#1E2E1C', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2E4429' },
  disclaimerText: { color: '#A9C79A', fontSize: 11, lineHeight: 16, flex: 1 },
});
