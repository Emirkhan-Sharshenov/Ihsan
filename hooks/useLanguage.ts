import { usePersistentState } from './usePersistentState';
import { translations, type Lang, type TranslationKeys } from '@/data/translations';

export function useLanguage() {
  const [lang, setLang] = usePersistentState<Lang>('@app_lang', 'ru');
  const t = translations[lang];
  return { lang, setLang, t };
}
