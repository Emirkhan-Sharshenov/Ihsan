import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareText(text: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await copyText(text);
    }
    return;
  }
  await Share.share({ message: text }).catch(() => {});
}
