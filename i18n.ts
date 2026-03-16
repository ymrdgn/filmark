import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import tr from './locales/tr.json';

const LANGUAGE_KEY = '@app_language';

// Get device language
const getDeviceLanguage = () => {
  const deviceLanguage = Localization.locale?.split('-')[0] || 'en';
  // Only support en and tr, default to en
  return ['en', 'tr'].includes(deviceLanguage) ? deviceLanguage : 'en';
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
};

// Initialize i18n
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
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
