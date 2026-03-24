import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ku from './locales/ku.json';
import ptBR from './locales/pt-BR.json';
import ptPT from './locales/pt-PT.json';
import fa from './locales/fa.json';
import zh from './locales/zh.json';

const LANGUAGE_KEY = '@app_language';

// Supported languages
const SUPPORTED_LANGUAGES = [
  'en',
  'tr',
  'ar',
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ku',
  'pt-BR',
  'pt-PT',
  'fa',
  'zh',
];

// Get device language
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  const deviceLanguage = locales[0]?.languageCode || 'en';
  // Check if device language is supported
  return SUPPORTED_LANGUAGES.includes(deviceLanguage) ? deviceLanguage : 'en';
};

// Get saved language or device language
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error loading language:', error);
    return 'en';
  }
};

const resources = {
  en: {
    translation: en,
  },
  tr: {
    translation: tr,
  },
  ar: {
    translation: ar,
  },
  de: {
    translation: de,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  it: {
    translation: it,
  },
  ja: {
    translation: ja,
  },
  ku: {
    translation: ku,
  },
  'pt-BR': {
    translation: ptBR,
  },
  'pt-PT': {
    translation: ptPT,
  },
  fa: {
    translation: fa,
  },
  zh: {
    translation: zh,
  },
};

// Initialize i18n
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: getDeviceLanguage(), // Will be updated in app initialization
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Function to change language and save to storage
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
    console.log('Language changed to:', language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Function to initialize language from storage
export const initializeLanguage = async () => {
  const language = await getInitialLanguage();
  await i18n.changeLanguage(language);
  console.log('Initialized language:', language);
};

export default i18n;
