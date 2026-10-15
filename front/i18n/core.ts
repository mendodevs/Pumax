/**
 * Núcleo de traducciones (sin React). Cada pantalla guarda sus textos en i18n/locales/<area>.ts
 * con la forma { es: {...}, en: {...} }; acá se unen en un solo diccionario.
 * El español es el idioma de respaldo: si falta una clave en inglés se muestra en español.
 */
import common from "./locales/common";
import nav from "./locales/nav";
import home from "./locales/home";
import reports from "./locales/reports";
import stock from "./locales/stock";
import lists from "./locales/lists";
import forms from "./locales/forms";
import billing from "./locales/billing";
import account from "./locales/account";
import users from "./locales/users";
import settings from "./locales/settings";
import notifications from "./locales/notifications";

export type Lang = "es" | "en";
export type Dict = Record<string, string>;
export type LocaleModule = { es: Dict; en: Dict };
export type Vars = Record<string, string | number>;

const modules: LocaleModule[] = [common, nav, home, reports, stock, lists, forms, billing, account, users, settings, notifications];

const dictionaries: Record<Lang, Dict> = { es: {}, en: {} };
for (const m of modules) {
  Object.assign(dictionaries.es, m.es);
  Object.assign(dictionaries.en, m.en);
}

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: "es", label: "Español", short: "ES" },
  { code: "en", label: "English", short: "EN" },
];

let currentLang: Lang = "es";
export const setCurrentLang = (lang: Lang) => {
  currentLang = lang;
};
export const getCurrentLang = () => currentLang;

/** Código de región para fechas y números */
export const localeOf = (lang: Lang = currentLang) => (lang === "en" ? "en-US" : "es-AR");
export const getLocale = () => localeOf(currentLang);

/** Traduce `key`. Variables con llaves: t("hello", { name: "Ana" }) con "Hola {name}" */
export function translate(key: string, vars?: Vars, lang: Lang = currentLang): string {
  const raw = dictionaries[lang][key] ?? dictionaries.es[key] ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`)) : raw;
}

/** Plural simple: usa `${key}.one` cuando n === 1 y `${key}.other` en el resto; {n} se completa solo */
export function translatePlural(key: string, n: number, vars?: Vars, lang: Lang = currentLang): string {
  return translate(`${key}.${n === 1 ? "one" : "other"}`, { n, ...vars }, lang);
}
