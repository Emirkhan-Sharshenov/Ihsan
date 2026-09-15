import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, Copy, Heart, Search, Share2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import duaData from './duas/dua_muslimclub.json';
import lifeSituationDuas from './duas/dua_life_situations.json';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/hooks/useLanguage';

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

const duas = [...(duaData as Dua[]), ...(lifeSituationDuas as Dua[])];

const categoryKeys: Record<string, string> = {
  'Намазы': 'catNamazy',
  'Покаяние': 'catRepentance',
  'Поминания': 'catRemembrance',
  'Повседневные': 'catDaily',
  'Трудности': 'catDifficulties',
  'Скорбь': 'catGrief',
  'Защита': 'catProtection',
  'Рамадан': 'catRamadan',
  'Природа': 'catNature',
  'Праздники': 'catHolidays',
  'Здоровье': 'catHealth',
  'Тревога и стресс': 'catAnxiety',
  'Мотивация и воля': 'catMotivation',
  'Финансы и долги': 'catFinance',
  'Решения и призвание': 'catDecisions',
  'Быт и время': 'catRoutine',
  'Учёба и память': 'catStudy',
  'Самооценка': 'catSelfEsteem',
  'Отношения': 'catRelationships',
  'Здоровье и сон': 'catHealthSleep',
  'Страхи и одиночество': 'catFears',
  'Работа и карьера': 'catCareer',
};

export default function DuasScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [category, setCategory] = useState('Все');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const { favorites, toggleFavorite } = useFavorites();

  const rawCategories = [
    'Все', 'Намазы', 'Покаяние', 'Поминания', 'Повседневные', 'Трудности', 'Скорбь', 'Защита', 'Рамадан', 'Природа', 'Праздники', 'Здоровье',
    'Тревога и стресс', 'Мотивация и воля', 'Финансы и долги', 'Решения и призвание', 'Быт и время', 'Учёба и память', 'Самооценка', 'Отношения', 'Здоровье и сон', 'Страхи и одиночество', 'Работа и карьера',
  ];
  const categories = rawCategories.map((cat) => {
    if (cat === 'Все') return { raw: cat, label: t.catAll };
    const key = categoryKeys[cat] as keyof typeof t;
    return { raw: cat, label: t[key] };
  });

  const visible = useMemo(() => {
    return duas.filter((item) => {
      const matchesCategory = category === 'Все' || item.category === category;
      const matchesQuery = !query || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const handleCopy = (item: Dua) => {
    const text = `${item.title}\n\n${item.arabic}\n\n${item.transliteration}\n\n${item.translation}${item.source ? `\n\n${t.duasSource}: ${item.source}` : ''}`;
    setCopiedSlug(item.slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const handleShare = (item: Dua) => {
    const text = `${item.title}\n\n${item.arabic}\n\n${item.translation}${item.source ? `\n\n${t.duasSource}: ${item.source}` : ''}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedSlug(item.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const getCategoryLabel = (raw: string) => {
    if (raw === 'Все') return t.catAll;
    const key = categoryKeys[raw] as keyof typeof t;
    return t[key];
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', '#071526']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t.duasEyebrow}</Text>
        <Text style={styles.title}>{t.duasTitle}</Text>
        <Text style={styles.intro}>{t.duasIntro}</Text>

        <View style={styles.searchBox}>
          <Search color="#96A9BE" size={19} />
          <TextInput value={query} onChangeText={setQuery} placeholder={t.duasSearchPlaceholder} placeholderTextColor="#8EA1B5" style={styles.input} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <Pressable key={cat.raw} onPress={() => setCategory(cat.raw)} style={[styles.categoryChip, category === cat.raw && styles.activeChip]}>
              <Text style={[styles.chipText, category === cat.raw && styles.activeChipText]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{category === 'Все' ? t.duasAll : getCategoryLabel(category)}</Text>
          <Text style={styles.count}>{visible.length} {t.duasTexts}</Text>
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t.duasEmpty}</Text>
            <Pressable onPress={() => { setQuery(''); setCategory('Все'); }}><Text style={styles.emptyAction}>{t.duasReset}</Text></Pressable>
          </View>
        ) : null}

        {visible.map((item) => {
          const isOpen = expanded === item.slug;
          const isFavorite = favorites.includes(item.slug);
          const itemCategoryLabel = getCategoryLabel(item.category);
          return (
            <View key={item.slug} style={[styles.duaCard, isOpen && styles.openCard]}>
              <Pressable onPress={() => setExpanded(isOpen ? null : item.slug)} style={styles.cardTop}>
                <View style={styles.badge}><Text style={styles.badgeText}>دُعَاء</Text></View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{itemCategoryLabel}</Text>
                </View>
                <Pressable onPress={() => toggleFavorite(item.slug)} hitSlop={8}>
                  <Heart color={isFavorite ? '#F58B8B' : '#7890A6'} fill={isFavorite ? '#F58B8B' : 'transparent'} size={19} />
                </Pressable>
                <ChevronDown color="#7890A6" size={18} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
              </Pressable>
              {isOpen && (
                <View style={styles.detail}>
                  {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                  {item.arabic ? <Text style={styles.arabic}>{item.arabic}</Text> : null}
                  {item.transliteration ? (
                    <>
                      <Text style={styles.sectionLabel}>{t.duasTranscription}</Text>
                      <Text style={styles.transliteration}>{item.transliteration}</Text>
                    </>
                  ) : null}
                  {item.translation ? (
                    <>
                      <Text style={styles.sectionLabel}>{t.duasTranslation}</Text>
                      <Text style={styles.translation}>{item.translation}</Text>
                    </>
                  ) : null}
                  {item.source ? <Text style={styles.source}>{t.duasSource}: {item.source}</Text> : null}
                  <View style={styles.actionRow}>
                    <Pressable style={styles.actionButton} onPress={() => handleCopy(item)}>
                      {copiedSlug === item.slug ? <Check color="#A9F06B" size={16} /> : <Copy color="#94A9BE" size={16} />}
                      <Text style={styles.actionText}>{copiedSlug === item.slug ? t.duesCopied : t.duasCopy}</Text>
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={() => handleShare(item)}>
                      <Share2 color="#94A9BE" size={16} />
                      <Text style={styles.actionText}>{t.duasShare}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 32 },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#F4F8FC', fontSize: 30, fontWeight: '700', marginTop: 9 },
  intro: { color: '#A4B6C8', fontSize: 14, lineHeight: 21, marginTop: 10 },
  searchBox: { height: 50, borderRadius: 17, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 22 },
  input: { flex: 1, marginLeft: 10, color: '#F4F8FC', fontSize: 14 },
  categoryScroll: { flexDirection: 'row', gap: 8, marginTop: 18, paddingBottom: 4 },
  categoryChip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 14, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765' },
  activeChip: { backgroundColor: '#A9F06B', borderColor: '#A9F06B' },
  chipText: { color: '#94A9BE', fontSize: 12, fontWeight: '600' },
  activeChipText: { color: '#0A1C31', fontWeight: '700' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  filterLabel: { color: '#F4F8FC', fontSize: 17, fontWeight: '700' },
  count: { color: '#849AAF', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#849AAF', fontSize: 15, marginBottom: 12 },
  emptyAction: { color: '#A9F06B', fontSize: 14, fontWeight: '700' },
  duaCard: { backgroundColor: '#10243C', borderColor: '#203D5A', borderWidth: 1, borderRadius: 19, marginBottom: 11, padding: 15 },
  openCard: { borderColor: '#5F8872' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D7F3BE', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#214432', fontSize: 11, fontWeight: '700' },
  cardCopy: { flex: 1 },
  cardTitle: { color: '#F4F8FC', fontSize: 15, fontWeight: '700' },
  cardSubtitle: { color: '#8298AE', fontSize: 11, marginTop: 4 },
  detail: { borderTopColor: '#294765', borderTopWidth: 1, marginTop: 15, paddingTop: 16 },
  description: { color: '#A4B6C8', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  arabic: { color: '#E9F5DE', fontSize: 22, lineHeight: 38, textAlign: 'right' },
  sectionLabel: { color: '#5F8872', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  transliteration: { color: '#C8D8E6', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  translation: { color: '#B8C8D6', fontSize: 13, lineHeight: 20 },
  source: { color: '#A9F06B', fontSize: 12, marginTop: 14, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#122B46', borderRadius: 12, borderWidth: 1, borderColor: '#294765' },
  actionText: { color: '#94A9BE', fontSize: 12, fontWeight: '600' },
});
