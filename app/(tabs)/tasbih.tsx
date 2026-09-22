import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Infinity as InfinityIcon, RefreshCcw, RotateCcw, Settings2, Vibrate, VibrateOff, X } from 'lucide-react-native';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/AppText';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArabicText, BottomSheet, Card, Chip, IconButton, PrimaryButton, ScreenBackground, ScreenHeader, type } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import type { Lang } from '@/data/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useSettings } from '@/hooks/useSettings';
import { useTasbihCount } from '@/hooks/useTasbihCount';

const GOALS = [33, 34, 99, 100];
const QUICK_GOALS = [33, 99, 0]; // 0 = no limit

// Arabic and meaning for the well-known phrases; custom phrases are shown as typed.
const KNOWN: Record<string, { arabic: string; meaning: Record<Lang, string> }> = {
  'Субханаллах': { arabic: 'سُبْحَانَ اللَّهِ', meaning: { ru: 'Пречист Аллах от всяких недостатков', ky: 'Алла бардык кемчиликтен пок' } },
  'Альхамдулиллях': { arabic: 'الْحَمْدُ لِلَّهِ', meaning: { ru: 'Хвала Аллаху', ky: 'Аллага мактоо' } },
  'Аллаху акбар': { arabic: 'اللَّهُ أَكْبَرُ', meaning: { ru: 'Аллах велик', ky: 'Алла Улук' } },
  'Астагфируллах': { arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: { ru: 'Прошу прощения у Аллаха', ky: 'Алладан кечирим сураймын' } },
  'Ля иляха илляллах': { arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', meaning: { ru: 'Нет божества, кроме Аллаха', ky: 'Аллахтан башка кудай жок' } },
};

export default function TasbihScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { count, total, increment, reset } = useTasbihCount();
  const [settings, setSettings] = useSettings();
  const [phraseIndex, setPhraseIndex] = usePersistentState('@tasbih_phrase', 0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const scale = useRef(new Animated.Value(1)).current;

  const phrases = settings.tasbihPhrases;
  const goal = Math.max(0, settings.tasbihGoal);
  const unlimited = goal === 0;
  const currentIndex = Math.min(phraseIndex, Math.max(0, phrases.length - 1));
  const phrase = phrases[currentIndex] ?? '—';
  const known = KNOWN[phrase];
  const roundsCompleted = unlimited ? 0 : Math.floor(count / goal);
  const progressInRound = unlimited ? count : count % goal;
  const vibrate = settings.tasbihVibration && Platform.OS !== 'web';

  const handleTap = () => {
    const next = count + 1;
    increment();
    if (vibrate) {
      if (!unlimited && next % goal === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 60, useNativeDriver: true }),
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

  const setGoal = (g: number) => setSettings((prev) => ({ ...prev, tasbihGoal: g }));

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.tabTasbih} />
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={type.eyebrow}>{t.tasbihEyebrow}</Text>
            <Text style={type.display}>{t.tasbihTitle}</Text>
          </View>
          <IconButton
            label={t.tasbihVibrationLabel}
            active={settings.tasbihVibration}
            onPress={() => setSettings((prev) => ({ ...prev, tasbihVibration: !prev.tasbihVibration }))}
          >
            {settings.tasbihVibration ? <Vibrate color={colors.accent} size={20} /> : <VibrateOff color={colors.textMuted} size={20} />}
          </IconButton>
          <IconButton label={t.tasbihSettingsTitle} onPress={() => setShowSettings(true)}>
            <Settings2 color={colors.text} size={20} />
          </IconButton>
        </View>

        <Card style={styles.phraseCard}>
          <View style={styles.phraseNav}>
            <Pressable style={styles.navArrow} onPress={() => cyclePhrase(-1)} hitSlop={8} accessibilityRole="button">
              <ChevronLeft color={colors.textMuted} size={22} />
            </Pressable>
            <View style={styles.dots}>
              {phrases.map((item, index) => (
                <Pressable key={`${item}-${index}`} onPress={() => setPhraseIndex(index)} hitSlop={6} style={[styles.dot, index === currentIndex && styles.activeDot]} />
              ))}
            </View>
            <Pressable style={styles.navArrow} onPress={() => cyclePhrase(1)} hitSlop={8} accessibilityRole="button">
              <ChevronRight color={colors.textMuted} size={22} />
            </Pressable>
          </View>
          {known ? (
            <ArabicText size={30} style={{ color: colors.accent, textAlign: 'center' }}>
              {known.arabic}
            </ArabicText>
          ) : null}
          <Text style={styles.phrase}>{phrase}</Text>
          {known ? <Text style={[type.muted, { textAlign: 'center' }]}>{known.meaning[lang]}</Text> : null}
        </Card>

        <View style={styles.counterWrap}>
          <View style={styles.ringOuter}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <Pressable onPress={handleTap} style={({ pressed }) => [styles.counter, pressed && styles.counterPressed]} accessibilityRole="button" accessibilityLabel={`${count}`}>
                <Text style={styles.count}>{count}</Text>
                <Text style={styles.tap}>{(!unlimited && count > 0 && progressInRound === 0 ? t.tasbihRoundDone : t.tasbihTap).toUpperCase()}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {!unlimited ? (
          <>
            <View style={styles.roundHeader}>
              <Text style={type.eyebrow}>{t.tasbihCurrentRound}</Text>
              <Text style={styles.roundCount}>
                {progressInRound} <Text style={{ color: colors.textMuted }}>/ {goal}</Text>
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(progressInRound / goal) * 100}%` }]} />
            </View>
          </>
        ) : null}

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIcon}>
              <RefreshCcw color={colors.accent} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.small}>{t.tasbihRoundsDone}</Text>
              <Text style={styles.statValue}>
                {roundsCompleted} {!unlimited ? <Text style={type.small}>{t.tasbihPer.replace('{n}', String(goal))}</Text> : null}
              </Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIcon}>
              <InfinityIcon color={colors.accent} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.small}>{t.tasbihTotal}</Text>
              <Text style={styles.statValue}>{total.toLocaleString('ru-RU')}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.segment}>
            {QUICK_GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGoal(g)}
                style={[styles.segmentItem, goal === g && styles.segmentItemActive]}
                accessibilityRole="button"
                accessibilityLabel={g === 0 ? t.tasbihNoLimit : String(g)}
              >
                {g === 0 ? (
                  <InfinityIcon color={goal === 0 ? colors.accentDark : colors.textMuted} size={18} />
                ) : (
                  <Text style={[styles.segmentText, goal === g && styles.segmentTextActive]}>{g}</Text>
                )}
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setShowResetConfirm(true)} style={styles.resetButton} accessibilityRole="button">
            <RotateCcw color={colors.text} size={17} />
            <Text style={styles.resetText}>{t.tasbihReset}</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>{t.tasbihHint}</Text>
      </ScrollView>

      <BottomSheet visible={showSettings} title={t.tasbihSettingsTitle} onClose={() => setShowSettings(false)}>
        <Text style={styles.modalLabel}>{t.tasbihGoalPerRound}</Text>
        <View style={styles.goalRow}>
          {GOALS.map((g) => (
            <Chip key={g} label={String(g)} active={goal === g} onPress={() => setGoal(g)} />
          ))}
          <Chip label={t.tasbihNoLimit} active={goal === 0} onPress={() => setGoal(0)} />
        </View>

        <Text style={styles.modalLabel}>{t.tasbihPhrases}</Text>
        {phrases.map((p, index) => (
          <View key={`${p}-${index}`} style={styles.phraseRow}>
            <Text style={styles.phraseRowText}>{p}</Text>
            {phrases.length > 1 ? (
              <Pressable onPress={() => removePhrase(index)} hitSlop={10} accessibilityRole="button">
                <X color={colors.textMuted} size={16} />
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
            placeholderTextColor={colors.textMutedDark}
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
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 },
  phraseCard: { marginTop: 18, alignItems: 'center', gap: 4 },
  phraseNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  navArrow: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3A5670' },
  activeDot: { width: 22, backgroundColor: colors.accent },
  phrase: { color: colors.text, fontSize: 22, fontFamily: fonts.semibold, textAlign: 'center' },
  counterWrap: { alignItems: 'center', marginTop: 28 },
  ringOuter: { width: 264, height: 264, borderRadius: 132, backgroundColor: colors.cardDeep, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  counter: { width: 212, height: 212, borderRadius: 106, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: '#2A4866', alignItems: 'center', justifyContent: 'center' },
  counterPressed: { backgroundColor: colors.activePrayerBg },
  count: { color: colors.text, fontSize: 64, fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  tap: { color: colors.textMuted, fontSize: 12, letterSpacing: 1.2, fontFamily: fonts.medium, textAlign: 'center', paddingHorizontal: 24 },
  roundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 8 },
  roundCount: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  statIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: colors.text, fontSize: 20, fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, gap: 12 },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4 },
  segmentItem: { minWidth: 48, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  segmentItemActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.semibold },
  segmentTextActive: { color: colors.accentDark },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 50 },
  resetText: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
  hint: { color: colors.textMutedDark, fontSize: 12, lineHeight: 18, marginTop: 22, textAlign: 'center', fontFamily: fonts.regular },
  modalLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 10, marginTop: 12, fontFamily: fonts.medium },
  goalRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  phraseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  phraseRowText: { color: colors.text, fontSize: 14, flex: 1, fontFamily: fonts.regular },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addInput: { flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 14, color: colors.text, fontSize: 14, fontFamily: fonts.regular },
  addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  confirmCard: { backgroundColor: colors.cardAlt, borderRadius: 22, padding: 24, borderWidth: 1, borderColor: colors.border, width: '100%', maxWidth: 360 },
  confirmText: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold, textAlign: 'center', marginBottom: 20 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmCancel: { flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  confirmCancelText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15 },
  confirmOk: { flex: 1, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmOkText: { color: colors.accentDark, fontFamily: fonts.bold, fontSize: 15 },
});
