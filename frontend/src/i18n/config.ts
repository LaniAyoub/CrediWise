import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enAgences from '../locales/en/agences.json';
import enGestionnaires from '../locales/en/gestionnaires.json';
import enClients from '../locales/en/clients.json';
import enDemandes from '../locales/en/demandes.json';

import frCommon from '../locales/fr/common.json';
import frAuth from '../locales/fr/auth.json';
import frDashboard from '../locales/fr/dashboard.json';
import frAgences from '../locales/fr/agences.json';
import frGestionnaires from '../locales/fr/gestionnaires.json';
import frClients from '../locales/fr/clients.json';
import frDemandes from '../locales/fr/demandes.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    agences: enAgences,
    gestionnaires: enGestionnaires,
    clients: enClients,
    demandes: enDemandes,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    dashboard: frDashboard,
    agences: frAgences,
    gestionnaires: frGestionnaires,
    clients: frClients,
    demandes: frDemandes,
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect browser language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'agences', 'gestionnaires', 'clients', 'demandes'],
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
