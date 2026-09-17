import { Tabs } from 'expo-router';
import { BookOpen, Compass, CircleUserRound, HandHeart, House, RotateCcw } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/hooks/useLanguage';
import { tabColors } from '@/constants/theme';

export default function TabsLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabColors.active,
        tabBarInactiveTintColor: tabColors.inactive,
        tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom, paddingBottom: 8 + insets.bottom }],
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
    backgroundColor: tabColors.barBg,
    borderTopColor: tabColors.barBorder,
    paddingTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
