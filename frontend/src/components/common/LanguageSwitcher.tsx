import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '@/hooks/useDarkMode';

type Language = 'en' | 'fr';

interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

/**
 * LanguageSwitcher component for toggling between languages
 * Persists language preference to localStorage
 */
export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    (i18n.language as Language) || 'en'
  );
  const [isOpen, setIsOpen] = useState(false);

  // Sync state with i18n changes
  useEffect(() => {
    setCurrentLanguage((i18n.language as Language) || 'en');
  }, [i18n.language]);

  const handleLanguageChange = (language: Language) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
    setIsOpen(false);
  };

  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.code === currentLanguage);

  return (
    <div className="flex items-center gap-2">
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200 group"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light Mode' : 'Dark Mode'}
      >
        {isDark ? (
          /* Light Mode Icon */
          <svg className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          /* Dark Mode Icon */
          <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Language Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-200 text-sm font-medium text-surface-700 dark:text-surface-300"
          aria-label="Change language"
          aria-expanded={isOpen}
        >
        <span className="text-lg">{currentOption?.flag}</span>
        <span className="hidden sm:inline">{currentOption?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg dark:shadow-xl z-50"
            role="menu"
          >
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageChange(option.code)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-150 ${
                currentLanguage === option.code
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                  : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
              }`}
              role="menuitem"
            >
              <span className="text-lg">{option.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
              </div>
              {currentLanguage === option.code && (
                <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
          </div>
        )}

        {/* Overlay to close dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
