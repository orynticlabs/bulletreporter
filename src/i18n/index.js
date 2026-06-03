import hi from './hi'
import en from './en'

export const translations = { hi, en }

export const getTranslations = (lang = 'hi') => {
  return translations[lang] || translations.hi
}

export { hi, en }
