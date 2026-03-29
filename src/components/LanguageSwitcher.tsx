'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Languages className="h-4 w-4 text-gray-500 ml-2" />
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          language === 'zh'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          language === 'en'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
    </div>
  );
}
