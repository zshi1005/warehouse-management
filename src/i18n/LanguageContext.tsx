'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.zh;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      setLanguage(savedLang);
    } else {
      // 根据浏览器语言自动检测
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setLanguage('zh');
      } else {
        setLanguage('en');
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const t = translations[language];

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
