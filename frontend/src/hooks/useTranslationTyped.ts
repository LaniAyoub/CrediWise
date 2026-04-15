import { useTranslation } from 'react-i18next';

/**
 * Type-safe translation hook
 * Provides better IDE support and autocompletion for translation keys
 *
 * Usage:
 *   const { t } = useTranslationTyped('dashboard');
 *   const welcomeText = t('welcome', { name: 'John' });
 */
type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'dashboard'
  | 'agences'
  | 'gestionnaires'
  | 'clients'
  | 'demandes';

export const useTranslationTyped = (
  namespace: TranslationNamespace = 'common'
) => {
  return useTranslation(namespace);
};

export default useTranslationTyped;
