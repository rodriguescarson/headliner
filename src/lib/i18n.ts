import i18next from "i18next";
import en from "@/lib/locales/en.json";

// Single-locale initialisation for now. Every user-facing string goes through t(); en.json is the source of truth.
if (!i18next.isInitialized) {
  void i18next.init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    // Synchronous init: the client must have the locale before its first render, or hydration text mismatches.
    initAsync: false,
  });
}

export const t = (key: string, opts?: Record<string, unknown>) =>
  i18next.t(key, opts) as string;
export default i18next;
