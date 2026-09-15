import { Tabs } from 'expo-router';
import { BookOpen, Compass, CircleUserRound, HandHeart, House, RotateCcw } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';

export default function TabsLayout() {
  const { t } = useLanguage();
  const accent = '#A9F06B';
  const muted = '#95A4B8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabHome, tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="quran" options={{ title: t.tabQuran, tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="duas" options={{ title: t.tabDuas, tabBarIcon: ({ color, size }) => <HandHeart color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="tasbih" options={{ title: t.tabTasbih, tabBarIcon: ({ color, size }) => <RotateCcw color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="qibla" options={{ title: t.tabQibla, tabBarIcon: ({ color, size }) => <Compass color={color} size={size} strokeWidth={2.2} /> }} />
      <Tabs.Screen name="profile" options={{ title: t.tabProfile, tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} strokeWidth={2.2} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#10243C',
    borderTopColor: '#24415F',
    height: 74,
    paddingTop: 8,
    paddingBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
