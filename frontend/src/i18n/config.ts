import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations with assertions
import enCommon from '../locales/en/common.json' assert { type: 'json' };
import enAuth from '../locales/en/auth.json' assert { type: 'json' };
import enDashboard from '../locales/en/dashboard.json' assert { type: 'json' };
import enAgences from '../locales/en/agences.json' assert { type: 'json' };
import enGestionnaires from '../locales/en/gestionnaires.json' assert { type: 'json' };
import enClients from '../locales/en/clients.json' assert { type: 'json' };
import enDemandes from '../locales/en/demandes.json' assert { type: 'json' };
import enAnalyse from '../locales/en/analyse.json' assert { type: 'json' };

import frCommon from '../locales/fr/common.json' assert { type: 'json' };
import frAuth from '../locales/fr/auth.json' assert { type: 'json' };
import frDashboard from '../locales/fr/dashboard.json' assert { type: 'json' };
import frAgences from '../locales/fr/agences.json' assert { type: 'json' };
import frGestionnaires from '../locales/fr/gestionnaires.json' assert { type: 'json' };
import frClients from '../locales/fr/clients.json' assert { type: 'json' };
import frDemandes from '../locales/fr/demandes.json' assert { type: 'json' };
import frAnalyse from '../locales/fr/analyse.json' assert { type: 'json' };

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    agences: enAgences,
    gestionnaires: enGestionnaires,
    clients: enClients,
    demandes: enDemandes,
    analyse: enAnalyse,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    dashboard: frDashboard,
    agences: frAgences,
    gestionnaires: frGestionnaires,
    clients: frClients,
    demandes: frDemandes,
    analyse: frAnalyse,
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
    ns: ['common', 'auth', 'dashboard', 'agences', 'gestionnaires', 'clients', 'demandes', 'analyse'],
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    returnObjects: false, // Don't return objects
    react: {
      useSuspense: true, // Use Suspense to wait for i18n initialization
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
    },
  });

export default i18n;
