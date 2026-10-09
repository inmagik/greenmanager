import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { resources } from "./resources"
import { setupYupLocale } from "./yup"

// Only Italian in the MVP; LanguageSelector stays hidden while there is one language.
export const supportedLanguages = ["it"] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

setupYupLocale(i18n)

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "it",
    nsSeparator: false,
    supportedLngs: supportedLanguages,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "greenmanager-language",
    },
  })

export default i18n
