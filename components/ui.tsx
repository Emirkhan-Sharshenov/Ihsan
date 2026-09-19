import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';

export function ScreenBackground() {
  return <LinearGradient colors={[colors.bgGradientTop, colors.bg]} locations={[0, 0.35]} style={StyleSheet.absoluteFill} />;
}

// Top bar: screen title on the left, optional action buttons on the right.
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function IconButton({
  children,
  onPress,
  active,
  label,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  active?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, active && styles.iconButtonActive, pressed && { opacity: 0.8 }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ label, tone = 'green', style }: { label: string; tone?: 'green' | 'muted' | 'warn'; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, tone === 'muted' && styles.pillMuted, tone === 'warn' && styles.pillWarn, style]}>
      <Text style={[styles.pillText, tone === 'muted' && styles.pillTextMuted, tone === 'warn' && styles.pillTextWarn]}>{label}</Text>
    </View>
  );
}

export function Note({ icon, text, style }: { icon?: ReactNode; text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.note, style]}>
      {icon}
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

export function Toggle({ value }: { value: boolean }) {
  return (
    <View style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  style,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive, style]}
    >
      {icon}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
  scroll = true,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close" />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <X color={colors.textMuted} size={22} />
            </Pressable>
          </View>
          {scroll ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </View>
    </Modal>
  );
}

export function PrimaryButton({ label, onPress, icon, style }: { label: string; onPress: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }, style]} onPress={onPress} accessibilityRole="button">
      {icon}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, style }: { label: string; onPress: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }, style]} onPress={onPress} accessibilityRole="button">
      {icon}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

// Arabic text in the Amiri face; `size` scales line height so diacritics are never clipped.
export function ArabicText({ children, size = 24, style, numberOfLines }: { children: string; size?: number; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: fonts.arabic, fontSize: size, lineHeight: Math.round(size * 1.85), color: colors.text, textAlign: 'right', writingDirection: 'rtl' }, style]}>
      {children}
    </Text>
  );
}

export const type = StyleSheet.create({
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 1.5, fontFamily: fonts.semibold },
  display: { color: colors.text, fontSize: 30, lineHeight: 36, fontFamily: fonts.bold, letterSpacing: -0.4 },
  headline: { color: colors.text, fontSize: 20, lineHeight: 26, fontFamily: fonts.semibold },
  title: { color: colors.text, fontSize: 16, lineHeight: 22, fontFamily: fonts.semibold },
  body: { color: colors.text, fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  small: { color: colors.textMuted, fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  label: { color: colors.accent, fontSize: 10, letterSpacing: 1, fontFamily: fonts.semibold },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginBottom: 8 },
  headerTitle: { color: colors.text, fontSize: 22, fontFamily: fonts.semibold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { backgroundColor: colors.accentMuted },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.accentMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillMuted: { backgroundColor: colors.cardAlt },
  pillWarn: { backgroundColor: colors.warnBg },
  pillText: { color: colors.accent, fontSize: 11, fontFamily: fonts.semibold },
  pillTextMuted: { color: colors.textMuted },
  pillTextWarn: { color: colors.warnText },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  noteText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, flex: 1, fontFamily: fonts.regular },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#294765', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.accent },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#EAF2F8' },
  toggleKnobOn: { alignSelf: 'flex-end', backgroundColor: colors.bg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: '#B4C3D2', fontSize: 13, fontFamily: fonts.medium },
  chipTextActive: { color: colors.accentDark, fontFamily: fonts.semibold },
  overlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cardAlt,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '88%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold, flex: 1, marginRight: 12 },
  primaryButton: { flexDirection: 'row', gap: 10, backgroundColor: colors.accent, borderRadius: 16, minHeight: 52, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { color: colors.accentDark, fontFamily: fonts.bold, fontSize: 15 },
  secondaryButton: { flexDirection: 'row', gap: 8, backgroundColor: colors.cardAlt, borderRadius: 16, borderWidth: 1, borderColor: colors.border, minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
});
