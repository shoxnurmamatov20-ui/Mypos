import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';
import kz from './locales/kz.json';

// Phase 4: kz added; ru is the cross-locale fallback (lingua franca in CA).
type SupportedLocale = 'uz' | 'ru' | 'en' | 'kz';
const SUPPORTED: readonly SupportedLocale[] = ['uz', 'ru', 'en', 'kz'];

const deviceLocale = getLocales()[0]?.languageCode ?? 'uz';
const supportedLocale = SUPPORTED.includes(deviceLocale as SupportedLocale)
  ? (deviceLocale as SupportedLocale)
  : 'uz';

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
    kz: { translation: kz },
  },
  lng: supportedLocale,
  // Per-locale fallback chain: kz -> ru -> uz; everyone else -> uz.
  fallbackLng: { kz: ['ru', 'uz'], default: ['uz'] },
  interpolation: { escapeValue: false },
});

export default i18n;
