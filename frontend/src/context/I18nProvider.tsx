import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * I18nProvider wraps the application with i18next configuration
 * This must be initialized before the app starts
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;
