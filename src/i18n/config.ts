import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import taTranslations from '../locales/ta.json';
import hiTranslations from '../locales/hi.json';

export type AppLanguage = 'en' | 'ta' | 'hi';

const getInitialLanguage = (): AppLanguage => {
  try {
    const saved = localStorage.getItem('apticore_preferred_language') as AppLanguage;
    if (saved && ['en', 'ta', 'hi'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'en';
};

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ta: { translation: taTranslations },
    hi: { translation: hiTranslations },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  returnNull: false,
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

export default i18n;
