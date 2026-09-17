import type { ReactNode } from 'react';
import { X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

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

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]} onPress={onPress} accessibilityRole="button">
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#294765', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.accent },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#EAF2F8' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: '#294765',
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: '#94A9BE', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.accentDark, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(7,21,38,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    borderWidth: 1,
    borderColor: '#24415F',
    maxHeight: '88%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1, marginRight: 12 },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: colors.accentDark, fontWeight: '700', fontSize: 15 },
});
