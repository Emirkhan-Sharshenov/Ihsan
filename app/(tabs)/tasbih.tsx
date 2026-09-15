import { useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Settings2, X } from 'lucide-react-native';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/hooks/useSettings';
import { useTasbihCount } from '@/hooks/useTasbihCount';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useLanguage } from '@/hooks/useLanguage';

export default function TasbihScreen() {
  const { t } = useLanguage();
  const { count, total, increment, reset } = useTasbihCount();
  const [settings, setSettings] = useSettings();
  const [phrase, setPhrase] = usePersistentState('tasbih-phrase', 0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const phrases = settings.tasbihPhrases;
  const goal = settings.tasbihGoal;
  const roundsCompleted = Math.floor(count / goal);
  const progressInRound = count % goal;
  const scale = useRef(new Animated.Value(1)).current;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleTap = () => {
    increment();
    triggerHaptic();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    if (progressInRound + 1 >= goal) {
      triggerHaptic();
    }
  };

  const handleResetPress = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    reset();
    triggerHaptic();
    setShowResetConfirm(false);
  };

  const addPhrase = () => {
    const trimmed = newPhrase.trim();
    if (trimmed && !phrases.includes(trimmed)) {
      setSettings((prev) => ({ ...prev, tasbihPhrases: [...prev.tasbihPhrases, trimmed] }));
      setNewPhrase('');
    }
  };

  const removePhrase = (index: number) => {
    setSettings((prev) => ({ ...prev, tasbihPhrases: prev.tasbihPhrases.filter((_, i) => i !== index) }));
    if (phrase >= index && phrase > 0) {
      setPhrase(phrase - 1);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#153957', '#071526']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t.tasbihEyebrow}</Text>
            <Text style={styles.title}>{t.tasbihTitle}</Text>
          </View>
          <Pressable style={styles.settings} onPress={() => setShowSettings(true)}>
            <Settings2 color="#D8E8F5" size={20} />
          </Pressable>
        </View>

        <View style={styles.selector}>
          <Text style={styles.selectorLabel}>{t.tasbihCurrentPhrase}</Text>
          <View style={styles.phraseNav}>
            <Pressable style={styles.navArrow} onPress={() => setPhrase((prev) => (prev - 1 + phrases.length) % phrases.length)} hitSlop={12}>
              <ChevronLeft color="#849AAF" size={28} />
            </Pressable>
            <Text style={styles.phrase}>{phrases[phrase] ?? '—'}</Text>
            <Pressable style={styles.navArrow} onPress={() => setPhrase((prev) => (prev + 1) % phrases.length)} hitSlop={12}>
              <ChevronRight color="#849AAF" size={28} />
            </Pressable>
          </View>
          <View style={styles.dots}>
            {phrases.map((item, index) => (
              <Pressable key={`${item}-${index}`} onPress={() => setPhrase(index)} style={[styles.dot, index === phrase && styles.activeDot]} />
            ))}
          </View>
        </View>

        <Animated.View style={{ alignSelf: 'center', transform: [{ scale }] }}>
          <Pressable onPress={handleTap} style={({ pressed }) => [styles.counter, pressed && styles.counterPressed]}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.tap}>{t.tasbihTap}</Text>
            {progressInRound > 0 && (
              <View style={styles.progressWrap}>
                <View style={[styles.progressBar, { width: `${Math.min((progressInRound / goal) * 100, 100)}%` }]} />
              </View>
            )}
          </Pressable>
        </Animated.View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.goal}>{t.tasbihGoal}: {goal}</Text>
            <Text style={styles.rounds}>{t.tasbihRounds}: {roundsCompleted}</Text>
            <Text style={styles.total}>{t.tasbihTotal}: {total.toLocaleString('ru-RU')}</Text>
          </View>
          <Pressable onPress={handleResetPress} style={styles.reset}>
            <RotateCcw color="#A9F06B" size={18} />
            <Text style={styles.resetText}>{t.tasbihReset}</Text>
          </Pressable>
        </View>

        <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.tasbihSettingsTitle}</Text>
                <Pressable onPress={() => setShowSettings(false)} hitSlop={12}><X color="#94A9BE" size={22} /></Pressable>
              </View>

              <Text style={styles.modalLabel}>{t.tasbihGoalPerRound}</Text>
              <View style={styles.goalRow}>
                {[33, 99, 100, 1000].map((g) => (
                  <Pressable key={g} style={[styles.goalChip, goal === g && styles.activeGoalChip]} onPress={() => setSettings((prev) => ({ ...prev, tasbihGoal: g }))}>
                    <Text style={[styles.goalChipText, goal === g && styles.activeGoalChipText]}>{g}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>{t.tasbihPhrases}</Text>
              {phrases.map((p, index) => (
                <View key={`${p}-${index}`} style={styles.phraseRow}>
                  <Text style={styles.phraseRowText}>{p}</Text>
                  <Pressable onPress={() => removePhrase(index)} hitSlop={8}><X color="#7890A6" size={16} /></Pressable>
                </View>
              ))}

              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={newPhrase}
                  onChangeText={setNewPhrase}
                  placeholder={t.tasbihAddPhrase}
                  placeholderTextColor="#5A7088"
                />
                <Pressable style={styles.addButton} onPress={addPhrase}>
                  <Check color="#0A1C31" size={18} />
                </Pressable>
              </View>

              <Pressable style={styles.modalButton} onPress={() => setShowSettings(false)}>
                <Text style={styles.modalButtonText}>{t.tasbihDone}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={showResetConfirm} transparent animationType="fade" onRequestClose={() => setShowResetConfirm(false)}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmText}>{t.tasbihResetConfirm}</Text>
              <View style={styles.confirmRow}>
                <Pressable style={styles.confirmCancel} onPress={() => setShowResetConfirm(false)}><Text style={styles.confirmCancelText}>{t.homeModalDone}</Text></Pressable>
                <Pressable style={styles.confirmOk} onPress={handleResetConfirm}><Text style={styles.confirmOkText}>{t.tasbihReset}</Text></Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { padding: 24, paddingTop: 60, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#F4F8FC', fontSize: 30, fontWeight: '700', marginTop: 9 },
  settings: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  selector: { backgroundColor: '#10243C', borderRadius: 20, borderWidth: 1, borderColor: '#203D5A', padding: 20, marginTop: 34, alignItems: 'center' },
  selectorLabel: { color: '#849AAF', fontSize: 12 },
  phraseNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, width: '100%' },
  navArrow: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  phrase: { color: '#E9F5DE', fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 7, marginTop: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#526B82' },
  activeDot: { width: 21, backgroundColor: '#A9F06B' },
  counter: { width: 245, height: 245, borderRadius: 123, backgroundColor: '#234D52', borderWidth: 13, borderColor: '#355E65', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 55, shadowColor: '#A9F06B', shadowOpacity: 0.12, shadowRadius: 25, elevation: 5 },
  counterPressed: { transform: [{ scale: 0.97 }], backgroundColor: '#2C6260' },
  count: { color: '#F4FFF0', fontSize: 64, fontWeight: '700' },
  tap: { color: '#AFD1C0', fontSize: 12, marginTop: 3 },
  progressWrap: { width: 180, height: 4, borderRadius: 2, backgroundColor: '#1A3A3E', marginTop: 14, overflow: 'hidden' },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: '#A9F06B' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 55 },
  goal: { color: '#8FA5B9', fontSize: 13 },
  rounds: { color: '#A9F06B', fontSize: 13, fontWeight: '600', marginTop: 4 },
  total: { color: '#6C8298', fontSize: 12, marginTop: 4 },
  reset: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10 },
  resetText: { color: '#A9F06B', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#10243C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: '#24415F' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#F4F8FC', fontSize: 20, fontWeight: '700' },
  modalLabel: { color: '#849AAF', fontSize: 12, marginBottom: 10, marginTop: 10 },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#122B46', borderWidth: 1, borderColor: '#294765' },
  activeGoalChip: { backgroundColor: '#A9F06B', borderColor: '#A9F06B' },
  goalChipText: { color: '#94A9BE', fontSize: 14, fontWeight: '600' },
  activeGoalChipText: { color: '#0A1C31', fontWeight: '700' },
  phraseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#122B46', borderRadius: 12, borderWidth: 1, borderColor: '#294765', marginBottom: 8 },
  phraseRowText: { color: '#D9E4EE', fontSize: 14 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addInput: { flex: 1, backgroundColor: '#122B46', borderRadius: 12, borderWidth: 1, borderColor: '#294765', paddingVertical: 12, paddingHorizontal: 14, color: '#F4F8FC', fontSize: 14 },
  addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#A9F06B', alignItems: 'center', justifyContent: 'center' },
  modalButton: { backgroundColor: '#A9F06B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  modalButtonText: { color: '#0A1C31', fontWeight: '700', fontSize: 15 },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  confirmCard: { backgroundColor: '#10243C', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#294765', width: '100%' },
  confirmText: { color: '#F4F8FC', fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmCancel: { flex: 1, backgroundColor: '#122B46', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#294765' },
  confirmCancelText: { color: '#94A9BE', fontWeight: '700', fontSize: 15 },
  confirmOk: { flex: 1, backgroundColor: '#A9F06B', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmOkText: { color: '#0A1C31', fontWeight: '700', fontSize: 15 },
});
