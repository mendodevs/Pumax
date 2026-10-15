/** @type {import('tailwindcss').Config} */
// Colores que cambian según el tema (valores en constants/palette.ts)
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const slate = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, v(`slate-${n}`)])
);

module.exports = {
  // Todas las carpetas que contienen clases de NativeWind
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Verde Pumax (logo: #0b6623)
        brand: {
          DEFAULT: "#0b6623",
          50: "#eefbf1",
          100: "#d6f5de",
          200: "#aeeabd",
          300: v("brand-300"),
          400: v("brand-400"),
          500: "#158a33",
          600: "#0b6623",
          700: "#095220",
          800: "#073f19",
          900: "#052d12",
        },
        // Bordó Pumax (logo: #ae2151)
        wine: {
          DEFAULT: "#ae2151",
          400: v("wine-400"),
          500: "#c42e5f",
          600: "#ae2151",
          700: "#8f1a42",
          800: "#701434",
          900: "#520e26",
        },
        // Neutros: cambian con el tema. "gray" apunta a la misma escala por pantallas viejas.
        slate,
        gray: slate,
        // Color de texto principal (blanco en oscuro, casi negro en claro)
        ink: v("ink"),
        amber: { 400: v("amber-400") },
        red: { 400: v("red-400") },
        sky: { 400: v("sky-400") },
      },
    },
  },
  plugins: [],
};
