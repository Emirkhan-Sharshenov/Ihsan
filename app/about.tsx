import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';
import { privacyPolicy } from '@/data/privacyPolicy';
import { useLanguage } from '@/hooks/useLanguage';

export default function AboutScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const isPrivacy = section === 'privacy';
  const policy = privacyPolicy[lang];

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#102D49', colors.bg]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={styles.backButton} accessibilityRole="button">
            <ArrowLeft color="#EAF4FF" size={20} />
          </Pressable>
          <Text style={styles.title}>{isPrivacy ? t.profilePrivacy : t.profileAbout}</Text>
        </View>
        {isPrivacy ? (
          <>
            <Text style={styles.updated}>{policy.updated}</Text>
            {policy.sections.map((s) => (
              <View key={s.title} style={styles.block}>
                <Text style={styles.blockTitle}>{s.title}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.body}>{t.aboutText}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  title: { color: colors.text, fontSize: 22, fontFamily: fonts.bold, flex: 1 },
  updated: { color: colors.textMutedDark, fontSize: 12, fontFamily: fonts.regular, marginBottom: 10 },
  block: { marginBottom: 18 },
  blockTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.bold, marginBottom: 6 },
  body: { color: '#C8D8E6', fontSize: 14, fontFamily: fonts.regular, lineHeight: 22 },
});
