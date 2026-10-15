import { useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import { localeOf, translate, translatePlural, type Vars } from "./core";

export { translate, translatePlural, getLocale, getCurrentLang, LANGUAGES } from "./core";
export type { Lang } from "./core";

/**
 * Hook de idioma para componentes.
 *   const { t, tn, lang, locale } = useI18n();
 *   t("home.greeting", { name })      // texto con variables
 *   tn("home.orders", 3)              // plural: usa home.orders.one / home.orders.other
 * Fuera de componentes (servicios, utils) usá `translate(...)`.
 */
export function useI18n() {
  const { settings } = useSettings();
  const lang = settings.language;
  const t = useCallback((key: string, vars?: Vars) => translate(key, vars, lang), [lang]);
  const tn = useCallback((key: string, n: number, vars?: Vars) => translatePlural(key, n, vars, lang), [lang]);
  return { t, tn, lang, locale: localeOf(lang) };
}
