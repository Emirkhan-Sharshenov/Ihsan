import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

// The system font size setting is respected, but capped: at 150% (a common Android setting)
// labels like "Направление кыблы" would otherwise break across three lines and clip.
const MAX_FONT_SCALE = 1.2;

export function Text(props: TextProps) {
  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} />;
}

export function TextInput(props: TextInputProps) {
  return <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} />;
}
