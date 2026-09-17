import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, Copy, Heart, Search, Share2 } from 'lucide-react-native';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/ui';
import { colors } from '@/constants/theme';
import { DUA_CATEGORIES, duas, type Dua, type DuaCategory } from '@/data/duas';
import { categoryName, type TranslationKeys } from '@/data/translations';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';
import { copyText, shareText } from '@/lib/share';

type Filter = 'all' | 'favorites' | DuaCategory;

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

function duaAsText(item: Dua, t: TranslationKeys): string {
  return [
    item.title,
    item.arabic,
    item.transliteration,
    item.translation,
    `${t.duasSource}: ${item.source}`,
  ]
    .filter(Boolean)
    .join('\n\n');
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
      <Text style={styles.eyebrow}>{t.duasEyebrow}</Text>
      <Text style={styles.title}>{t.duasTitle}</Text>
      <Text style={styles.intro}>{t.duasIntro}</Text>
      {t.duasLanguageNote ? <Text style={styles.langNote}>{t.duasLanguageNote}</Text> : null}

      <View style={styles.searchBox}>
        <Search color="#96A9BE" size={19} />
        <TextInput value={query} onChangeText={setQuery} placeholder={t.duasSearchPlaceholder} placeholderTextColor="#8EA1B5" style={styles.input} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll} style={styles.categoryScrollView}>
        <Chip label={t.duasAll} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip
          label={t.duasFavorites}
          active={filter === 'favorites'}
          onPress={() => setFilter('favorites')}
          icon={<Heart color={filter === 'favorites' ? colors.accentDark : colors.heart} size={13} fill={filter === 'favorites' ? colors.accentDark : colors.heart} />}
        />
        {categories.map((c) => (
          <Chip key={c} label={categoryName(t, c)} active={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      <Text style={styles.count}>{t.duasCount.replace('{n}', String(visible.length))}</Text>

      {visible.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t.duasEmpty}</Text>
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
      <LinearGradient colors={['#102D49', colors.bg]} style={StyleSheet.absoluteFill} />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.slug}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<Text style={styles.footerNote}>{t.duasTranscriptionNote}</Text>}
        renderItem={({ item }) => {
          const isOpen = expanded === item.slug;
          const isFavorite = favorites.includes(item.slug);
          return (
            <View style={[styles.duaCard, isOpen && styles.openCard]}>
              <Pressable onPress={() => setExpanded(isOpen ? null : item.slug)} style={styles.cardTop} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.categories.map((c) => categoryName(t, c)).join(' · ')}</Text>
                </View>
                <Pressable onPress={() => toggleFavorite(item.slug)} hitSlop={10} accessibilityRole="button">
                  <Heart color={isFavorite ? colors.heart : '#7890A6'} fill={isFavorite ? colors.heart : 'transparent'} size={19} />
                </Pressable>
                <ChevronDown color="#7890A6" size={18} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
              </Pressable>
              {isOpen ? (
                <View style={styles.detail}>
                  <Text style={styles.arabic}>{item.arabic}</Text>
                  <Text style={styles.sectionLabel}>{t.duasTranscription}</Text>
                  <Text style={styles.transliteration}>{item.transliteration}</Text>
                  <Text style={styles.sectionLabel}>{t.duasTranslation}</Text>
                  <Text style={styles.translation}>{item.translation}</Text>
                  {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                  <Text style={styles.source}>
                    {t.duasSource}: {item.source}
                  </Text>
                  <View style={styles.actionRow}>
                    <Pressable style={styles.actionButton} onPress={() => handleCopy(item)} accessibilityRole="button">
                      {copiedSlug === item.slug ? <Check color={colors.accent} size={16} /> : <Copy color="#94A9BE" size={16} />}
                      <Text style={styles.actionText}>{copiedSlug === item.slug ? t.duasCopied : t.duasCopy}</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={() => shareText(duaAsText(item, t))} accessibilityRole="button">
                      <Share2 color="#94A9BE" size={16} />
                      <Text style={styles.actionText}>{t.duasShare}</Text>
                    </Pressable>
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
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 9 },
  intro: { color: '#A4B6C8', fontSize: 14, lineHeight: 21, marginTop: 8 },
  langNote: { color: '#E8CE9A', fontSize: 12, marginTop: 6 },
  searchBox: { height: 50, borderRadius: 17, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 18 },
  input: { flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 },
  categoryScrollView: { marginHorizontal: -22, marginTop: 16 },
  categoryScroll: { flexDirection: 'row', gap: 8, paddingHorizontal: 22 },
  count: { color: colors.textMuted, fontSize: 12, marginTop: 16, marginBottom: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginBottom: 12 },
  emptyAction: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  duaCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 19, marginBottom: 10, padding: 15 },
  openCard: { borderColor: colors.borderActive },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  cardSubtitle: { color: '#8298AE', fontSize: 11, marginTop: 4 },
  detail: { borderTopColor: '#294765', borderTopWidth: 1, marginTop: 14, paddingTop: 14 },
  arabic: { color: '#E9F5DE', fontSize: 23, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl' },
  sectionLabel: { color: '#6E9A80', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 6 },
  transliteration: { color: '#C8D8E6', fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  translation: { color: '#D0DCE6', fontSize: 14, lineHeight: 21 },
  description: { color: '#A4B6C8', fontSize: 13, lineHeight: 19, marginTop: 14 },
  source: { color: colors.accent, fontSize: 12, marginTop: 14, fontWeight: '600', lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: '#294765' },
  actionText: { color: '#94A9BE', fontSize: 12, fontWeight: '600' },
  footerNote: { color: colors.textMutedDark, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
});
