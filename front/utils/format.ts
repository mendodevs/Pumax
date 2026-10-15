import { getLocale } from "../i18n/core";

/** Importe según el idioma: es → "1.250,00", en → "1,250.00" */
export const money = (n: number) =>
  Number(n || 0).toLocaleString(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Número entero según el idioma */
export const int = (n: number) => Number(n || 0).toLocaleString(getLocale());

/** Fecha corta ("14/10/2026" o "10/14/2026") a partir de Date o texto ISO */
export const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString(getLocale(), { day: "2-digit", month: "2-digit", year: "numeric" });
