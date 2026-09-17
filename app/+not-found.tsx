import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';

export default function NotFoundScreen() {
  const { t } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: t.notFoundTitle }} />
      <View style={styles.container}>
        <Text style={styles.text}>{t.notFoundTitle}</Text>
        <Link href="/" style={styles.link}>
          {t.notFoundBack}
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.bg },
  text: { fontSize: 20, fontWeight: '600', color: colors.text },
  link: { marginTop: 15, paddingVertical: 15, color: colors.accent, fontSize: 16, fontWeight: '700' },
});
