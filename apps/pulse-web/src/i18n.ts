/** W08 i18n wire (P0-T408) — mirrors packages/i18n catalogs. */

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

const en: Record<string, string> = {
  "app.name": "TPulse",
  "app.tagline": "Transmission Pulse — energy corridor inspection OS",
  "nav.inspections": "Inspections",
  "nav.assets": "Assets",
  "nav.alerts": "Alerts",
  "nav.admin": "Admin",
  "nav.map": "Map",
  "nav.evidence": "Evidence",
  "admin.csv.title": "Asset CSV import",
  "admin.csv.hint": "Dry-run validates; apply writes sites/assets via pulse-api.",
  "admin.compliance": "Compliance report",
  "admin.locale": "Locale",
};

const hi: Record<string, string> = {
  "app.name": "TPulse",
  "app.tagline": "ऊर्जा निरीक्षण ऑपरेटिंग सिस्टम",
  "nav.inspections": "निरीक्षण",
  "nav.assets": "संपत्ति",
  "nav.alerts": "अलर्ट",
  "nav.admin": "एडमिन",
  "nav.map": "मानचित्र",
  "nav.evidence": "साक्ष्य",
  "admin.csv.title": "संपत्ति CSV आयात",
  "admin.csv.hint": "ड्राई-रन सत्यापित करता है; लागू करने पर API पर लिखता है।",
  "admin.compliance": "अनुपालन रिपोर्ट",
  "admin.locale": "भाषा",
};

const catalogs: Record<Locale, Record<string, string>> = { en, hi };

let current: Locale = "en";

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = LOCALES.includes(locale) ? locale : "en";
  try {
    localStorage.setItem("vp_locale", current);
  } catch {
    /* ignore */
  }
}

export function initLocale(): Locale {
  try {
    const raw = localStorage.getItem("vp_locale");
    if (raw === "en" || raw === "hi") current = raw;
  } catch {
    /* ignore */
  }
  return current;
}

export function t(key: string, locale: Locale = current): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}
