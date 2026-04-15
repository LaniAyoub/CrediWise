import React, { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * Loading fallback while i18n initializes
 */
const I18nLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-surface-50 dark:bg-surface-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
      <p className="text-surface-600 dark:text-surface-400">Loading...</p>
    </div>
  </div>
);

/**
 * I18nProvider wraps the application with i18next configuration
 * This must be initialized before the app starts
 * Wrapped with Suspense to handle async i18n initialization
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  return (
    <Suspense fallback={<I18nLoadingFallback />}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </Suspense>
  );
};

export default I18nProvider;
