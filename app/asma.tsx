import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { useAsmaHusna, nameOfTheDayIndex } from '@/hooks/useAsmaHusna';
import { asmaHusnaRu } from '@/data/asmaHusnaRu';

export default function AsmaHusnaScreen() {
  const { t } = useLanguage();
  const { names, loading, error, refresh } = useAsmaHusna();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return names;
    return names.filter(
      (n) =>
        n.transliteration.toLowerCase().includes(q) ||
        (asmaHusnaRu[n.number] ?? '').toLowerCase().includes(q) ||
        String(n.number).includes(q),
    );
  }, [names, query]);

  const todayIndex = nameOfTheDayIndex(names.length);
  const nameOfDay = names[todayIndex];

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', '#071526']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <ArrowLeft color="#EAF4FF" size={20} />
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>{t.asmaEyebrow}</Text>
            <Text style={styles.title}>{t.asmaTitle}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search color="#96A9BE" size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.asmaSearchPlaceholder}
            placeholderTextColor="#8EA1B5"
            style={styles.input}
          />
        </View>

        {nameOfDay && !query ? (
          <View style={styles.dayCard}>
            <Text style={styles.dayLabel}>{t.asmaNameOfDay}</Text>
            <Text style={styles.dayArabic}>{nameOfDay.name}</Text>
            <Text style={styles.dayTranslit}>{nameOfDay.transliteration}</Text>
            <Text style={styles.dayMeaning}>{asmaHusnaRu[nameOfDay.number] ?? nameOfDay.en.meaning}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#A9F06B" />
            <Text style={styles.stateText}>{t.asmaLoading}</Text>
          </View>
        ) : error && names.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.stateText}>{t.asmaError}</Text>
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
            renderItem={({ item }) => {
              const isOpen = expanded === item.number;
              return (
                <Pressable style={styles.nameRow} onPress={() => setExpanded(isOpen ? null : item.number)}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.translit}>{item.transliteration}</Text>
                    {isOpen ? (
                      <Text style={styles.meaning}>{asmaHusnaRu[item.number] ?? item.en.meaning}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.arabic}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        )}

        <Text style={styles.note}>{t.asmaNote}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#F4F8FC', fontSize: 26, fontWeight: '700', marginTop: 4 },
  searchBox: { height: 50, borderRadius: 17, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 20 },
  input: { flex: 1, marginLeft: 10, color: '#F4F8FC', fontSize: 14 },
  dayCard: { backgroundColor: '#A9F06B', borderRadius: 20, padding: 20, marginTop: 16, alignItems: 'center' },
  dayLabel: { color: '#254024', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  dayArabic: { color: '#0A1C31', fontSize: 32, fontWeight: '700', marginTop: 10 },
  dayTranslit: { color: '#1A3323', fontSize: 15, fontWeight: '600', marginTop: 4 },
  dayMeaning: { color: '#254024', fontSize: 13, marginTop: 8, textAlign: 'center' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40 },
  stateText: { color: '#849AAF', fontSize: 14, textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#A9F06B', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18 },
  retryText: { color: '#0A1C31', fontWeight: '700', fontSize: 13 },
  listContent: { paddingTop: 16, paddingBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10243C', borderRadius: 16, borderWidth: 1, borderColor: '#203D5A', padding: 13, marginBottom: 8, gap: 12 },
  numberBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#A9F06B', fontSize: 12, fontWeight: '700' },
  translit: { color: '#F4F8FC', fontSize: 14, fontWeight: '700' },
  meaning: { color: '#9CB3C6', fontSize: 12, marginTop: 5, lineHeight: 17 },
  arabic: { color: '#D7F3BE', fontSize: 19, minWidth: 50, textAlign: 'right' },
  note: { color: '#72889C', fontSize: 11, lineHeight: 16, textAlign: 'center', paddingTop: 4, paddingBottom: 4 },
});
