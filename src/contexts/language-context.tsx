import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import i18n, { type AppLanguage } from '@/i18n/config';

export type SupportedLanguage = AppLanguage;

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  localeCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', localeCode: 'en-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', localeCode: 'ta-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', localeCode: 'hi-IN' },
];

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultValueOrOptions?: string | Record<string, any>, options?: Record<string, any>) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('apticore_preferred_language') as SupportedLanguage;
      if (saved && ['en', 'ta', 'hi'].includes(saved)) {
        return saved;
      }
    } catch {}
    return (i18n.language as SupportedLanguage) || 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('apticore_preferred_language', lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  const t = (
    key: string,
    defaultValueOrOptions?: string | Record<string, any>,
    options?: Record<string, any>
  ): string => {
    if (typeof defaultValueOrOptions === 'string') {
      return (i18n.t as any)(key, defaultValueOrOptions, options);
    }
    return (i18n.t as any)(key, defaultValueOrOptions);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
