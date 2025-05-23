import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json';
import ru from './locales/ru.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import cz from './locales/cz.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    cz: { translation: cz },
  },
  lng: localStorage.getItem('lang') || navigator.language.slice(0, 2) || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
