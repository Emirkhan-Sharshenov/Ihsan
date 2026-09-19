import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';
import { asmaHusna, nameOfTheDayIndex } from '@/data/asmaHusna';
import { useLanguage } from '@/hooks/useLanguage';

export default function AsmaHusnaScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return asmaHusna;
    return asmaHusna.filter(
      (n) => n.transliteration.toLowerCase().includes(q) || n.ru.toLowerCase().includes(q) || String(n.number) === q || n.arabic.includes(query.trim()),
    );
  }, [query]);

  const nameOfDay = asmaHusna[nameOfTheDayIndex()];

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', colors.bg]} style={StyleSheet.absoluteFill} />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.number)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={styles.backButton} accessibilityRole="button">
                <ArrowLeft color="#EAF4FF" size={20} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>{t.asmaEyebrow}</Text>
                <Text style={styles.title}>{t.asmaTitle}</Text>
              </View>
            </View>

            {!query ? (
              <View style={styles.dayCard}>
                <Text style={styles.dayLabel}>{t.asmaNameOfDay}</Text>
                <Text style={styles.dayArabic}>{nameOfDay.arabic}</Text>
                <Text style={styles.dayTranslit}>{nameOfDay.transliteration}</Text>
                <Text style={styles.dayMeaning}>{nameOfDay.ru}</Text>
              </View>
            ) : null}

            <View style={styles.searchBox}>
              <Search color="#96A9BE" size={19} />
              <TextInput value={query} onChangeText={setQuery} placeholder={t.asmaSearchPlaceholder} placeholderTextColor="#8EA1B5" style={styles.input} />
            </View>
            <View style={{ height: 12 }} />
          </View>
        }
        ListFooterComponent={<Text style={styles.note}>{t.asmaNote}</Text>}
        renderItem={({ item }) => (
          <View style={styles.nameRow}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{item.number}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.translit}>{item.transliteration}</Text>
              <Text style={styles.meaning}>{item.ru}</Text>
            </View>
            <Text style={styles.arabic}>{item.arabic}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontFamily: fonts.bold },
  title: { color: colors.text, fontSize: 26, fontFamily: fonts.bold, marginTop: 4 },
  searchBox: { height: 50, borderRadius: 17, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: '#294765', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 16 },
  input: { flex: 1, marginLeft: 10, color: colors.text, fontSize: 14, fontFamily: fonts.regular },
  dayCard: { backgroundColor: colors.accent, borderRadius: 20, padding: 20, marginTop: 18, alignItems: 'center' },
  dayLabel: { color: '#254024', fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1 },
  dayArabic: { color: colors.accentDark, fontSize: 34, lineHeight: 60, fontFamily: fonts.arabic, marginTop: 4 },
  dayTranslit: { color: '#1A3323', fontSize: 16, fontFamily: fonts.bold, marginTop: 4 },
  dayMeaning: { color: '#254024', fontSize: 14, fontFamily: fonts.regular, marginTop: 6, textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 8, gap: 12 },
  numberBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#1D3C54', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.accent, fontSize: 12, fontFamily: fonts.bold },
  translit: { color: colors.text, fontSize: 14, fontFamily: fonts.bold },
  meaning: { color: '#9CB3C6', fontSize: 12, fontFamily: fonts.regular, marginTop: 4, lineHeight: 17 },
  arabic: { color: colors.accentSoft, fontSize: 22, lineHeight: 40, fontFamily: fonts.arabic, minWidth: 56, textAlign: 'right' },
  note: { color: colors.textMutedDark, fontSize: 11, fontFamily: fonts.regular, lineHeight: 16, textAlign: 'center', paddingTop: 10 },
});
