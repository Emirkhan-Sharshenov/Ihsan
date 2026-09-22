import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { BookOpen, Check, ChevronDown, Copy, Heart, Search, Share2 } from 'lucide-react-native';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArabicText, Chip, Pill, ScreenBackground, ScreenHeader, SecondaryButton, type } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { DUA_CATEGORIES, duas, type Dua, type DuaCategory } from '@/data/duas';
import { categoryName, type TranslationKeys } from '@/data/translations';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';
import { copyText, shareText } from '@/lib/share';

type Filter = 'all' | 'favorites' | DuaCategory;

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

function duaAsText(item: Dua, t: TranslationKeys): string {
  return [item.title, item.arabic, item.transliteration, item.translation, `${t.duasSource}: ${item.source}`].filter(Boolean).join('\n\n');
}

export default function DuasScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; open?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(params.open ?? null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (params.q !== undefined) setQuery(params.q);
  }, [params.q]);

  useEffect(() => {
    if (params.open) {
      setQuery('');
      setFilter('all');
      setExpanded(params.open);
    }
  }, [params.open]);

  const categories = useMemo(() => DUA_CATEGORIES.filter((c) => duas.some((d) => d.categories.includes(c))), []);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    const list = duas.filter((item) => {
      if (filter === 'favorites' && !favorites.includes(item.slug)) return false;
      if (filter !== 'all' && filter !== 'favorites' && !item.categories.includes(filter)) return false;
      if (!q) return true;
      return normalize(`${item.title} ${item.translation} ${item.transliteration} ${item.description ?? ''}`).includes(q);
    });
    // The dua opened from the home screen goes first so it is visible without scrolling.
    if (params.open) list.sort((a, b) => Number(b.slug === params.open) - Number(a.slug === params.open));
    return list;
  }, [query, filter, favorites, params.open]);

  const handleCopy = async (item: Dua) => {
    if (await copyText(duaAsText(item, t))) {
      setCopiedSlug(item.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const header = (
    <View>
      <ScreenHeader title={t.tabDuas} />
      <View style={styles.titleRow}>
        <Text style={[type.display, { flexShrink: 1 }]}>{t.duasTitle}</Text>
        <Pill label={`● ${t.duasCountChip.replace('{n}', String(duas.length))}`} style={{ alignSelf: 'center' }} />
      </View>
      <Text style={[type.muted, { marginTop: 4 }]}>{t.duasIntro}</Text>
      {t.duasLanguageNote ? <Text style={styles.langNote}>{t.duasLanguageNote}</Text> : null}

      <View style={styles.searchBox}>
        <Search color={colors.textMuted} size={20} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t.duasSearchPlaceholder} placeholderTextColor={colors.textMuted} style={styles.input} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll} style={styles.chipScrollView}>
        <Chip label={t.duasAll} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip
          label={t.duasFavorites}
          active={filter === 'favorites'}
          onPress={() => setFilter('favorites')}
          icon={<Heart color={filter === 'favorites' ? colors.accentDark : colors.heart} size={14} />}
        />
        {categories.map((c) => (
          <Chip key={c} label={categoryName(t, c)} active={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      {visible.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={type.muted}>{t.duasEmpty}</Text>
          <Pressable
            onPress={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            <Text style={styles.emptyAction}>{t.duasReset}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.slug}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<Text style={styles.footerNote}>{t.duasTranscriptionNote}</Text>}
        renderItem={({ item }) => {
          const isOpen = expanded === item.slug;
          const isFavorite = favorites.includes(item.slug);
          return (
            <View style={[styles.duaCard, isOpen && styles.openCard]}>
              <Pressable
                onPress={() => setExpanded(isOpen ? null : item.slug)}
                style={styles.cardTop}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
              >
                <View style={styles.cardCopy}>
                  <View style={styles.tags}>
                    {item.categories.slice(0, 2).map((c, i) => (
                      <Pill key={c} label={categoryName(t, c)} tone={i === 0 ? 'green' : 'muted'} />
                    ))}
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={isOpen ? undefined : 1}>
                    {item.title}
                  </Text>
                </View>
                <Pressable onPress={() => toggleFavorite(item.slug)} hitSlop={10} style={styles.roundIcon} accessibilityRole="button" accessibilityLabel={t.duasFavorites}>
                  <Heart color={isFavorite ? colors.heart : colors.textMuted} fill={isFavorite ? colors.heart : 'transparent'} size={19} />
                </Pressable>
                <ChevronDown color={colors.textMuted} size={20} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
              </Pressable>
              {isOpen ? (
                <View style={styles.detail}>
                  <View style={styles.arabicBox}>
                    <Text style={type.label}>{t.duasArabicLabel}</Text>
                    <ArabicText size={24}>{item.arabic}</ArabicText>
                  </View>
                  <Text style={styles.sectionLabel}>{t.duasTranscription}</Text>
                  <View style={styles.textBox}>
                    <Text style={styles.transliteration}>{item.transliteration}</Text>
                  </View>
                  <Text style={styles.sectionLabel}>{t.duasTranslation}</Text>
                  <View style={styles.textBox}>
                    <Text style={styles.translation}>{item.translation}</Text>
                  </View>
                  {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                  <View style={styles.sourceBox}>
                    <BookOpen color={colors.accent} size={16} />
                    <Text style={styles.sourceText}>
                      {t.duasSource}: {item.source}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <SecondaryButton
                      label={copiedSlug === item.slug ? t.duasCopied : t.duasCopy}
                      onPress={() => handleCopy(item)}
                      icon={copiedSlug === item.slug ? <Check color={colors.accent} size={16} /> : <Copy color={colors.text} size={16} />}
                      style={{ flex: 1 }}
                    />
                    <SecondaryButton label={t.duasShare} onPress={() => shareText(duaAsText(item, t))} icon={<Share2 color={colors.text} size={16} />} style={{ flex: 1 }} />
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 },
  langNote: { color: colors.warnText, fontSize: 12, marginTop: 6, fontFamily: fonts.regular },
  searchBox: { height: 52, borderRadius: 16, backgroundColor: colors.cardAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 18 },
  input: { flex: 1, marginLeft: 12, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  chipScrollView: { marginHorizontal: -20, marginTop: 16, marginBottom: 14 },
  chipScroll: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyAction: { color: colors.accent, fontSize: 14, fontFamily: fonts.semibold },
  duaCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 20, marginBottom: 12, padding: 16 },
  openCard: { borderColor: colors.borderActive },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCopy: { flex: 1, gap: 8 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  cardTitle: { color: colors.text, fontSize: 17, lineHeight: 23, fontFamily: fonts.semibold },
  roundIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  detail: { marginTop: 14 },
  arabicBox: { backgroundColor: colors.cardDeep, borderRadius: 16, padding: 14, gap: 6 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, fontFamily: fonts.semibold, marginTop: 16, marginBottom: 8 },
  textBox: { backgroundColor: colors.cardAlt, borderRadius: 12, padding: 12 },
  transliteration: { color: colors.text, fontSize: 14, lineHeight: 21, fontStyle: 'italic', fontFamily: fonts.regular },
  translation: { color: colors.text, fontSize: 15, lineHeight: 23, fontFamily: fonts.regular },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 14, fontFamily: fonts.regular },
  sourceBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.accentMuted, borderRadius: 12, padding: 12, marginTop: 14 },
  sourceText: { color: colors.accent, fontSize: 13, lineHeight: 18, flex: 1, fontFamily: fonts.semibold },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  footerNote: { color: colors.textMutedDark, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10, fontFamily: fonts.regular },
});
