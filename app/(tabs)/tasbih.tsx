import { useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Settings2, X } from 'lucide-react-native';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, Chip, PrimaryButton } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useSettings } from '@/hooks/useSettings';
import { useTasbihCount } from '@/hooks/useTasbihCount';

const GOALS = [33, 34, 99, 100];

// Arabic for the default phrases, shown under the Cyrillic text.
const ARABIC: Record<string, string> = {
  'Субханаллах': 'سُبْحَانَ اللَّهِ',
  'Альхамдулиллях': 'الْحَمْدُ لِلَّهِ',
  'Аллаху акбар': 'اللَّهُ أَكْبَرُ',
  'Астагфируллах': 'أَسْتَغْفِرُ اللَّهَ',
  'Ля иляха илляллах': 'لَا إِلَهَ إِلَّا اللَّهُ',
};

export default function TasbihScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { count, total, increment, reset } = useTasbihCount();
  const [settings, setSettings] = useSettings();
  const [phraseIndex, setPhraseIndex] = usePersistentState('@tasbih_phrase', 0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const scale = useRef(new Animated.Value(1)).current;

  const phrases = settings.tasbihPhrases;
  const goal = Math.max(1, settings.tasbihGoal);
  const phrase = phrases.length > 0 ? phrases[Math.min(phraseIndex, phrases.length - 1)] : '—';
  const roundsCompleted = Math.floor(count / goal);
  const progressInRound = count % goal;

  const handleTap = () => {
    const next = count + 1;
    increment();
    if (Platform.OS !== 'web') {
      if (next % goal === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const cyclePhrase = (dir: 1 | -1) => {
    if (phrases.length === 0) return;
    setPhraseIndex((prev) => (Math.min(prev, phrases.length - 1) + dir + phrases.length) % phrases.length);
  };

  const addPhrase = () => {
    const trimmed = newPhrase.trim();
    if (trimmed && !phrases.includes(trimmed)) {
      setSettings((prev) => ({ ...prev, tasbihPhrases: [...prev.tasbihPhrases, trimmed] }));
      setNewPhrase('');
    }
  };

  const removePhrase = (index: number) => {
    if (phrases.length <= 1) return;
    setSettings((prev) => ({ ...prev, tasbihPhrases: prev.tasbihPhrases.filter((_, i) => i !== index) }));
    setPhraseIndex((prev) => (prev > index || prev >= phrases.length - 1 ? Math.max(0, prev - 1) : prev));
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#153957', colors.bg]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t.tasbihEyebrow}</Text>
            <Text style={styles.title}>{t.tasbihTitle}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setShowSettings(true)} accessibilityRole="button" accessibilityLabel={t.tasbihSettingsTitle}>
            <Settings2 color="#D8E8F5" size={20} />
          </Pressable>
        </View>

        <View style={styles.selector}>
          <Text style={styles.selectorLabel}>{t.tasbihCurrentPhrase}</Text>
          <View style={styles.phraseNav}>
            <Pressable style={styles.navArrow} onPress={() => cyclePhrase(-1)} hitSlop={8} accessibilityRole="button">
              <ChevronLeft color="#849AAF" size={26} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              {ARABIC[phrase] ? <Text style={styles.phraseArabic}>{ARABIC[phrase]}</Text> : null}
              <Text style={styles.phrase}>{phrase}</Text>
            </View>
            <Pressable style={styles.navArrow} onPress={() => cyclePhrase(1)} hitSlop={8} accessibilityRole="button">
              <ChevronRight color="#849AAF" size={26} />
            </Pressable>
          </View>
          <View style={styles.dots}>
            {phrases.map((item, index) => (
              <Pressable key={`${item}-${index}`} onPress={() => setPhraseIndex(index)} hitSlop={6} style={[styles.dot, index === Math.min(phraseIndex, phrases.length - 1) && styles.activeDot]} />
            ))}
          </View>
        </View>

        <Animated.View style={{ alignSelf: 'center', transform: [{ scale }] }}>
          <Pressable onPress={handleTap} style={({ pressed }) => [styles.counter, pressed && styles.counterPressed]} accessibilityRole="button" accessibilityLabel={`${count}`}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.tap}>{count > 0 && progressInRound === 0 ? t.tasbihRoundDone : t.tasbihTap}</Text>
            <View style={styles.progressWrap}>
              <View style={[styles.progressBar, { width: `${(progressInRound / goal) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progressInRound} / {goal}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.goal}>
              {t.tasbihGoal}: {goal} · {t.tasbihRounds}: {roundsCompleted}
            </Text>
            <Text style={styles.total}>
              {t.tasbihTotal}: {total.toLocaleString('ru-RU')}
            </Text>
          </View>
          <Pressable onPress={() => setShowResetConfirm(true)} style={styles.reset} accessibilityRole="button">
            <RotateCcw color={colors.accent} size={18} />
            <Text style={styles.resetText}>{t.tasbihReset}</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>{t.tasbihHint}</Text>
      </ScrollView>

      <BottomSheet visible={showSettings} title={t.tasbihSettingsTitle} onClose={() => setShowSettings(false)}>
        <Text style={styles.modalLabel}>{t.tasbihGoalPerRound}</Text>
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <Chip key={g} label={String(g)} active={goal === g} onPress={() => setSettings((prev) => ({ ...prev, tasbihGoal: g }))} />
          ))}
        </View>

        <Text style={styles.modalLabel}>{t.tasbihPhrases}</Text>
        {phrases.map((p, index) => (
          <View key={`${p}-${index}`} style={styles.phraseRow}>
            <Text style={styles.phraseRowText}>{p}</Text>
            {phrases.length > 1 ? (
              <Pressable onPress={() => removePhrase(index)} hitSlop={10} accessibilityRole="button">
                <X color="#7890A6" size={16} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newPhrase}
            onChangeText={setNewPhrase}
            placeholder={t.tasbihAddPhrase}
            placeholderTextColor="#5A7088"
            onSubmitEditing={addPhrase}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={addPhrase} accessibilityRole="button">
            <Check color={colors.accentDark} size={18} />
          </Pressable>
        </View>
        <PrimaryButton label={t.done} onPress={() => setShowSettings(false)} />
      </BottomSheet>

      <Modal visible={showResetConfirm} transparent animationType="fade" onRequestClose={() => setShowResetConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmText}>{t.tasbihResetConfirm}</Text>
            <View style={styles.confirmRow}>
              <Pressable style={styles.confirmCancel} onPress={() => setShowResetConfirm(false)}>
                <Text style={styles.confirmCancelText}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={styles.confirmOk}
                onPress={() => {
                  reset();
                  setShowResetConfirm(false);
                }}
              >
                <Text style={styles.confirmOkText}>{t.tasbihReset}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 9 },
  iconButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  selector: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, marginTop: 26, alignItems: 'center' },
  selectorLabel: { color: colors.textMuted, fontSize: 12 },
  phraseNav: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, width: '100%' },
  navArrow: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  phraseArabic: { color: colors.accentSoft, fontSize: 24, marginBottom: 2 },
  phrase: { color: '#E9F5DE', fontSize: 19, fontWeight: '700', textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 7, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#526B82' },
  activeDot: { width: 21, backgroundColor: colors.accent },
  counter: { width: 240, height: 240, borderRadius: 120, backgroundColor: colors.activePrayerBg, borderWidth: 12, borderColor: '#355E65', alignItems: 'center', justifyContent: 'center', marginTop: 34 },
  counterPressed: { backgroundColor: '#2C6260' },
  count: { color: '#F4FFF0', fontSize: 62, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tap: { color: '#AFD1C0', fontSize: 12, marginTop: 2 },
  progressWrap: { width: 150, height: 4, borderRadius: 2, backgroundColor: '#1A3A3E', marginTop: 12, overflow: 'hidden' },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  progressText: { color: '#AFD1C0', fontSize: 11, marginTop: 6 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 34 },
  goal: { color: '#8FA5B9', fontSize: 13 },
  total: { color: '#6C8298', fontSize: 12, marginTop: 4 },
  reset: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10 },
  resetText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  hint: { color: colors.textMutedDark, fontSize: 12, lineHeight: 18, marginTop: 22, textAlign: 'center' },
  modalLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 10, marginTop: 12 },
  goalRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  phraseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: '#294765', marginBottom: 8 },
  phraseRowText: { color: '#D9E4EE', fontSize: 14, flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addInput: { flex: 1, backgroundColor: colors.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: '#294765', paddingVertical: 12, paddingHorizontal: 14, color: colors.text, fontSize: 14 },
  addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  confirmCard: { backgroundColor: colors.card, borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#294765', width: '100%', maxWidth: 360 },
  confirmText: { color: colors.text, fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmCancel: { flex: 1, backgroundColor: colors.cardAlt, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#294765' },
  confirmCancelText: { color: '#94A9BE', fontWeight: '700', fontSize: 15 },
  confirmOk: { flex: 1, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmOkText: { color: colors.accentDark, fontWeight: '700', fontSize: 15 },
});
