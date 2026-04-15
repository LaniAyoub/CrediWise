import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="py-4 px-6 text-center text-xs text-surface-500 dark:text-surface-400 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 transition-colors">
      © {new Date().getFullYear()} CrediWise. {t('common.copyright')}
    </footer>
  );
};

export default Footer;
