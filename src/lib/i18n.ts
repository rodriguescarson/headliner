import i18next from "i18next";
import en from "@/lib/locales/en.json";

// Single-locale initialisation for now. Every user-facing string goes through t(); en.json is the source of truth.
if (!i18next.isInitialized) {
  void i18next.init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export const t = (key: string, opts?: Record<string, unknown>) =>
  i18next.t(key, opts) as string;
export default i18next;
