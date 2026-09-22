import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Copy,
  Heart,
  Info,
  Languages,
  Pause,
  Play,
  RefreshCw,
  Search,
  SkipBack,
  SkipForward,
  Type,
  Volume2,
} from 'lucide-react-native';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, View, type ViewToken } from 'react-native';
import { Text, TextInput } from '@/components/AppText';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArabicText, Card, Chip, IconButton, Note, Pill, PrimaryButton, ScreenBackground, ScreenHeader, SecondaryButton, Toggle, type } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { sajdaLabel } from '@/data/sajdaLocations';
import { surahs, type Surah } from '@/data/surahs';
import type { Lang, TranslationKeys } from '@/data/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useLastRead, useSurahDetail, useSurahFavorites } from '@/hooks/useQuranSurahs';
import { useSettings } from '@/hooks/useSettings';
import { copyText } from '@/lib/share';

const RECITER_EDITION = 'ar.alafasy';
const audioUrlForAyah = (globalAyahNumber: number) => `https://cdn.islamic.network/quran/audio/128/${RECITER_EDITION}/${globalAyahNumber}.mp3`;
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const ARABIC_SIZES = [24, 28, 33];

type Filter = 'all' | 'meccan' | 'medinan' | 'favorites';

export default function QuranScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useSurahFavorites();
  const [lastRead, setLastRead] = useLastRead();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [active, setActive] = useState<{ surah: Surah; startAyah: number } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[-'‘’\s]/g, '');
    return surahs.filter((s) => {
      if (filter === 'meccan' && s.revelationType !== 'Meccan') return false;
      if (filter === 'medinan' && s.revelationType !== 'Medinan') return false;
      if (filter === 'favorites' && !favorites.includes(s.number)) return false;
      if (!q) return true;
      return (
        String(s.number) === q ||
        s.englishName.toLowerCase().replace(/[-'‘’\s]/g, '').includes(q) ||
        s.nameRu.toLowerCase().replace(/[-\s]/g, '').includes(q) ||
        s.name.includes(query.trim())
      );
    });
  }, [query, filter, favorites]);

  const lastReadSurah = lastRead ? surahs.find((s) => s.number === lastRead.surahNumber) : null;

  const openSurah = (surah: Surah, startAyah = 1) => {
    setActive({ surah, startAyah });
    if (!lastRead || lastRead.surahNumber !== surah.number) setLastRead({ surahNumber: surah.number, ayahNumber: startAyah });
  };

  const header = (
    <View>
      <ScreenHeader title={t.tabQuran} />
      <View style={styles.titleRow}>
        <Text style={type.display}>{t.quranTitle}</Text>
        <Pill label={t.quranCount} tone="muted" style={{ alignSelf: 'center' }} />
      </View>
      <Text style={[type.muted, { marginTop: 4 }]}>{t.quranSubtitle}</Text>

      <View style={styles.searchBox}>
        <Search color={colors.textMuted} size={20} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t.quranSearchPlaceholder} placeholderTextColor={colors.textMuted} style={styles.input} />
      </View>

      {lastReadSurah && lastRead && !query ? (
        <Pressable onPress={() => openSurah(lastReadSurah, lastRead.ayahNumber)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <Card style={styles.continueCard}>
            <Pill label={`● ${t.quranContinueReading.toUpperCase()}`} />
            <View style={styles.continueRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.continueTitle}>
                  {lastReadSurah.number}. {lastReadSurah.englishName}
                  {lang === 'ru' ? ` (${lastReadSurah.nameRu})` : ''}
                </Text>
                <Text style={type.small}>
                  {t.quranProgress
                    .replace('{n}', String(lastRead.ayahNumber))
                    .replace('{total}', String(lastReadSurah.numberOfAyahs))
                    .replace('{p}', String(Math.round((lastRead.ayahNumber / lastReadSurah.numberOfAyahs) * 100)))}
                </Text>
              </View>
              <View style={styles.playCircle}>
                <Play color={colors.accentDark} size={20} fill={colors.accentDark} />
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(3, (lastRead.ayahNumber / lastReadSurah.numberOfAyahs) * 100)}%` }]} />
            </View>
          </Card>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView} contentContainerStyle={styles.chipScroll}>
        <Chip label={`${t.quranFilterAll} (114)`} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={t.quranFilterMeccan} active={filter === 'meccan'} onPress={() => setFilter('meccan')} />
        <Chip label={t.quranFilterMedinan} active={filter === 'medinan'} onPress={() => setFilter('medinan')} />
        <Chip
          label={t.quranFilterFav}
          active={filter === 'favorites'}
          onPress={() => setFilter('favorites')}
          icon={<Heart color={filter === 'favorites' ? colors.accentDark : colors.heart} size={14} />}
        />
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.number)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={[type.muted, { textAlign: 'center', marginTop: 20 }]}>{t.quranEmpty}</Text>}
        renderItem={({ item }) => {
          const isFavorite = favorites.includes(item.number);
          const isReading = lastRead?.surahNumber === item.number;
          return (
            <Pressable style={({ pressed }) => [styles.surahRow, isReading && styles.surahRowReading, pressed && { opacity: 0.85 }]} onPress={() => openSurah(item)}>
              <View style={[styles.surahNumber, isReading && styles.surahNumberReading]}>
                <Text style={[styles.surahNumberText, isReading && { color: colors.accentDark }]}>{item.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.surahNameRow}>
                  <Text style={styles.surahName} numberOfLines={1}>
                    {item.englishName}
                  </Text>
                  {isReading ? <Pill label={t.quranReadingNow} /> : null}
                  <Pressable hitSlop={10} onPress={() => toggleFavorite(item.number)} accessibilityRole="button" accessibilityLabel={t.quranFilterFav}>
                    <Heart color={colors.heart} fill={isFavorite ? colors.heart : 'transparent'} size={16} />
                  </Pressable>
                </View>
                <Text style={type.small} numberOfLines={1}>
                  {lang === 'ru' ? `${item.nameRu} · ` : ''}
                  {item.numberOfAyahs} {t.quranAyahsShort} · {item.revelationType === 'Meccan' ? t.quranMeccan : t.quranMedinan}
                </Text>
              </View>
              <ArabicText size={20} style={{ color: colors.accentSoft, lineHeight: 34 }}>
                {item.name.replace(/^سُورَةُ\s*/, '')}
              </ArabicText>
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
            onNavigate={(number) => openSurah(surahs[number - 1])}
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
  onNavigate,
  onClose,
}: {
  surah: Surah;
  startAyah: number;
  lang: Lang;
  t: TranslationKeys;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAyahVisible: (ayahNumber: number) => void;
  onNavigate: (surahNumber: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [settings] = useSettings();
  const { ayahs, loading, error, refresh } = useSurahDetail(surah.number, lang);
  const [showTranslit, setShowTranslit] = usePersistentState('@quran_show_translit', true);
  const [sizeIndex, setSizeIndex] = usePersistentState('@quran_arabic_size', 0);
  const [playing, setPlaying] = useState<{ index: number; autoplay: boolean } | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [bookmarked, setBookmarked] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const listRef = useRef<FlatList>(null);
  const scrolledToStart = useRef(false);
  const arabicSize = ARABIC_SIZES[sizeIndex] ?? ARABIC_SIZES[0];

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

  const close = () => {
    stop();
    onClose();
  };

  const currentAyah = playing ? playing.index + 1 : 0;

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <View style={[styles.readerTop, { paddingTop: insets.top + 8 }]}>
        <View style={styles.readerHeader}>
          <Pressable onPress={close} hitSlop={12} style={styles.backButton} accessibilityRole="button">
            <ArrowLeft color={colors.text} size={22} />
          </Pressable>
          <Text style={[type.headline, { flex: 1 }]}>{t.quranReaderTitle}</Text>
        </View>
        <View style={styles.readerTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={type.small}>
              <Text style={{ color: colors.accent, fontFamily: fonts.semibold }}>{t.quranSurahLabel.replace('{n}', String(surah.number))}</Text> ·{' '}
              {surah.revelationType === 'Meccan' ? t.quranMeccan : t.quranMedinan} ({surah.numberOfAyahs} {t.quranAyahsShort})
            </Text>
            <Text style={styles.readerTitle} numberOfLines={1}>
              {surah.englishName}
              {lang === 'ru' ? ` • ${surah.nameRu}` : ''}
            </Text>
          </View>
          <IconButton label={t.quranFilterFav} onPress={onToggleFavorite} style={styles.roundButton}>
            <Heart color={colors.heart} fill={isFavorite ? colors.heart : 'transparent'} size={19} />
          </IconButton>
          <IconButton label={t.quranTextSize} onPress={() => setSizeIndex((sizeIndex + 1) % ARABIC_SIZES.length)} style={styles.roundButton}>
            <Type color={colors.text} size={19} />
          </IconButton>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
          <Text style={type.muted}>{t.quranAyahLoading}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={[type.muted, { textAlign: 'center' }]}>{t.quranAyahError}</Text>
          <PrimaryButton label={t.retry} onPress={refresh} icon={<RefreshCw color={colors.accentDark} size={16} />} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={ayahs}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={[styles.readerList, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 200);
          }}
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              <Card style={styles.audioCard}>
                <Pressable
                  style={styles.audioPlay}
                  onPress={() => (playing?.autoplay ? stop() : startAyahAt(0, true))}
                  accessibilityRole="button"
                  accessibilityLabel={playing?.autoplay ? t.quranStopSurah : t.quranPlaySurah}
                >
                  {playing?.autoplay ? <Pause color={colors.accentDark} size={24} fill={colors.accentDark} /> : <Play color={colors.accentDark} size={24} fill={colors.accentDark} />}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={type.title} numberOfLines={1}>
                    {t.quranReciterName}
                  </Text>
                  <Text style={type.small}>{audioError ? t.quranAudioNeedsInternet : t.quranListenSubtitle}</Text>
                </View>
                {playing ? (
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.audioCounter}>
                      {currentAyah} / {ayahs.length}
                    </Text>
                    <View style={styles.audioTrack}>
                      <View style={[styles.audioFill, { width: `${(currentAyah / ayahs.length) * 100}%` }]} />
                    </View>
                  </View>
                ) : null}
              </Card>

              <View style={styles.optionsRow}>
                <View style={styles.translatorChip}>
                  <Languages color={colors.textMuted} size={16} />
                  <Text style={styles.translatorText} numberOfLines={1}>
                    {lang === 'ky' ? 'Ш. Хакимов' : 'Эльмир Кулиев'}
                  </Text>
                </View>
                <Pressable style={styles.translitSwitch} onPress={() => setShowTranslit(!showTranslit)} accessibilityRole="switch" accessibilityState={{ checked: showTranslit }}>
                  <Text style={type.body}>{t.quranShowTransliteration}</Text>
                  <Toggle value={showTranslit} />
                </Pressable>
              </View>

              <Note icon={<Info color={colors.accent} size={16} />} text={`${t.quranTranslationSource}. ${t.quranTransliterationNote}`} />

              {surah.number !== 1 && surah.number !== 9 ? (
                <View style={styles.basmalaBox}>
                  <ArabicText size={26} style={{ color: colors.accent, textAlign: 'center' }}>
                    {BASMALA}
                  </ArabicText>
                  <Text style={[type.small, { fontStyle: 'italic', textAlign: 'center' }]}>{t.quranBasmalaMeaning}</Text>
                </View>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <View style={styles.navRow}>
              {surah.number > 1 ? (
                <SecondaryButton label={t.quranPrev} onPress={() => onNavigate(surah.number - 1)} icon={<SkipBack color={colors.text} size={16} />} style={{ flex: 1 }} />
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {surah.number < 114 ? (
                <PrimaryButton
                  label={t.quranNext}
                  onPress={() => onNavigate(surah.number + 1)}
                  icon={<SkipForward color={colors.accentDark} size={16} />}
                  style={{ flex: 1, marginTop: 0, minHeight: 48 }}
                />
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const isActive = playing?.index === index;
            const isPlayingThis = isActive && status.playing;
            const sajda = sajdaLabel(item.number, settings.madhab, t);
            return (
              <View style={[styles.ayahCard, isActive && styles.ayahCardActive]}>
                {sajda ? (
                  <View style={styles.sajdaBanner}>
                    <Text style={styles.sajdaText}>{sajda}</Text>
                  </View>
                ) : null}
                <View style={styles.ayahTopRow}>
                  <Pill label={`${surah.number}:${item.numberInSurah}`} />
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => toggleAyah(index)} hitSlop={8} style={styles.ayahAction} accessibilityRole="button" accessibilityLabel={t.quranPlaySurah}>
                    {isPlayingThis ? <Pause color={colors.accent} size={18} /> : <Volume2 color={isActive ? colors.accent : colors.textMuted} size={18} />}
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      onAyahVisible(item.numberInSurah);
                      setBookmarked(item.numberInSurah);
                    }}
                    hitSlop={8}
                    style={styles.ayahAction}
                    accessibilityRole="button"
                    accessibilityLabel={t.quranMarkRead}
                  >
                    {bookmarked === item.numberInSurah ? <BookmarkCheck color={colors.accent} size={18} /> : <Bookmark color={colors.textMuted} size={18} />}
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      const ok = await copyText(`${item.arabic}\n\n${item.translation}\n\n(${surah.englishName}, ${surah.number}:${item.numberInSurah})`);
                      if (ok) {
                        setCopied(item.numberInSurah);
                        setTimeout(() => setCopied(null), 1500);
                      }
                    }}
                    hitSlop={8}
                    style={styles.ayahAction}
                    accessibilityRole="button"
                    accessibilityLabel={t.quranCopyAyah}
                  >
                    <Copy color={copied === item.numberInSurah ? colors.accent : colors.textMuted} size={18} />
                  </Pressable>
                </View>
                <ArabicText size={arabicSize}>{item.arabic}</ArabicText>
                {showTranslit && item.transliteration ? (
                  <View style={styles.translitBox}>
                    <Text style={type.label}>{t.quranTransliterationLabel}</Text>
                    <Text style={styles.translitText}>{item.transliteration}</Text>
                  </View>
                ) : null}
                {item.translation ? (
                  <>
                    <Text style={[type.label, { color: colors.textMuted, marginTop: 14 }]}>{t.quranTranslationLabel}</Text>
                    <Text style={styles.translationText}>{item.translation}</Text>
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
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 },
  searchBox: { height: 52, borderRadius: 16, backgroundColor: colors.cardAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 18 },
  input: { flex: 1, marginLeft: 12, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  continueCard: { marginTop: 16, gap: 10 },
  continueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  continueTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold, marginBottom: 2 },
  playCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  chipScrollView: { marginHorizontal: -20, marginTop: 16, marginBottom: 12 },
  chipScroll: { gap: 8, paddingHorizontal: 20 },
  surahRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  surahRowReading: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  surahNumber: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  surahNumberReading: { backgroundColor: colors.accent },
  surahNumberText: { color: colors.accent, fontSize: 15, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  surahNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  surahName: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold, flexShrink: 1 },
  readerTop: { paddingHorizontal: 20, paddingBottom: 8 },
  readerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  readerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  readerTitle: { color: colors.text, fontSize: 22, fontFamily: fonts.bold, marginTop: 2 },
  roundButton: { width: 44, height: 44, borderRadius: 22 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  readerList: { paddingHorizontal: 20, paddingTop: 8 },
  audioCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  audioPlay: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  audioCounter: { color: colors.accent, fontSize: 12, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  audioTrack: { width: 60, height: 4, borderRadius: 2, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  audioFill: { height: 4, backgroundColor: colors.accent },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  translatorChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexShrink: 1 },
  translatorText: { color: colors.text, fontSize: 13, fontFamily: fonts.medium },
  translitSwitch: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  basmalaBox: { alignItems: 'center', paddingVertical: 8 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  ayahCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 12 },
  ayahCardActive: { borderColor: colors.accent },
  sajdaBanner: { backgroundColor: colors.cardAlt, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 12 },
  sajdaText: { color: colors.warnText, fontSize: 12, lineHeight: 17, fontFamily: fonts.medium },
  ayahTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ayahAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  translitBox: { backgroundColor: colors.cardDeep, borderRadius: 12, padding: 12, marginTop: 12, gap: 6 },
  translitText: { color: colors.text, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  translationText: { color: '#D2DDE8', fontSize: 15, lineHeight: 23, marginTop: 6, fontFamily: fonts.regular },
});
