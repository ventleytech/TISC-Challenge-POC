import { en } from "./catalogs/en.js";
import { hi } from "./catalogs/hi.js";

export const DEFAULT_LOCALE = "en";

/** @type {Readonly<Record<string, Readonly<Record<string, string>>>>} */
export const CATALOGS = Object.freeze({
  en,
  hi,
});

/** @returns {readonly string[]} */
export function listLocales() {
  return Object.freeze([...Object.keys(CATALOGS)]);
}

/**
 * @param {string} locale
 * @returns {Readonly<Record<string, string>>}
 */
export function getCatalog(locale) {
  return CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
}

/**
 * Translate a catalog key. Missing key → key itself. Unknown locale → en.
 * Optional `{name}` params interpolated from `vars`.
 *
 * @param {string} key
 * @param {string} [locale]
 * @param {Record<string, string | number>} [vars]
 * @returns {string}
 */
export function t(key, locale = DEFAULT_LOCALE, vars) {
  const catalog = getCatalog(locale);
  let value = catalog[key] ?? CATALOGS[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [name, raw] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(raw));
    }
  }
  return value;
}
