/**
 * Paleta por tema. Los valores son canales "R G B" para que Tailwind pueda aplicar
 * opacidad (bg-slate-800/50). tailwind.config.js solo referencia los nombres de las variables.
 *
 * - Oscuro: es el diseño original de Pumax.
 * - Claro: la escala slate se invierte (slate-900 = fondo de pantalla, slate-800 = tarjetas,
 *   slate-700 = bordes y campos, slate-400 = texto secundario) y los acentos de texto se oscurecen
 *   para mantener el contraste sobre blanco.
 */
export type ThemeMode = "light" | "dark";

export const palettes: Record<ThemeMode, Record<string, string>> = {
  dark: {
    "slate-50": "244 247 245",
    "slate-100": "233 238 235",
    "slate-200": "213 221 216",
    "slate-300": "182 194 187",
    "slate-400": "138 154 145",
    "slate-500": "77 95 85",
    "slate-600": "52 67 59",
    "slate-700": "38 50 44",
    "slate-800": "27 36 32",
    "slate-900": "19 26 22",
    "slate-950": "13 18 16",
    ink: "255 255 255",
    "brand-300": "123 216 147",
    "brand-400": "69 189 102",
    "wine-400": "224 80 125",
    "amber-400": "251 191 36",
    "red-400": "248 113 113",
    "sky-400": "56 189 248",
  },
  light: {
    "slate-50": "13 18 16",
    "slate-100": "27 36 32",
    "slate-200": "52 67 59",
    "slate-300": "77 95 85",
    "slate-400": "98 114 105",
    "slate-500": "125 140 131",
    "slate-600": "203 213 207",
    "slate-700": "225 232 228",
    "slate-800": "255 255 255",
    "slate-900": "243 246 244",
    "slate-950": "234 240 236",
    ink: "19 26 22",
    "brand-300": "11 102 35",
    "brand-400": "21 138 51",
    "wine-400": "174 33 81",
    "amber-400": "180 83 9",
    "red-400": "220 38 38",
    "sky-400": "2 132 199",
  },
};

/** Variables listas para NativeWind (`vars()`) */
export const cssVars = (mode: ThemeMode): Record<string, string> =>
  Object.fromEntries(Object.entries(palettes[mode]).map(([k, v]) => [`--c-${k}`, v]));

/** Bloque CSS para la web: `:root` es oscuro y `[data-theme="light"]` lo reemplaza */
export const themeCss = () => {
  const block = (mode: ThemeMode) =>
    Object.entries(palettes[mode])
      .map(([k, v]) => `--c-${k}:${v};`)
      .join("");
  return `:root{${block("dark")}color-scheme:dark;}:root[data-theme="light"]{${block("light")}color-scheme:light;}`;
};
