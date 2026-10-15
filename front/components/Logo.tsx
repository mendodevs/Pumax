import { Image } from "react-native";
import { useTheme } from "../context/SettingsContext";

const LIGHT = require("../assets/images/pumax-logo.png"); // colores originales, para fondos claros
const DARK = require("../assets/images/pumax-logo-dark.png"); // mismos trazos con tonos más claros, para fondos oscuros
const RATIO = 900 / 556;

/** Logo de Pumax con fondo transparente; elige la versión según el tema */
export default function Logo({ width = 150 }: { width?: number }) {
  const { isDark } = useTheme();
  return (
    <Image
      source={isDark ? DARK : LIGHT}
      style={{ width, height: width / RATIO }}
      resizeMode="contain"
      accessibilityLabel="Pumax"
    />
  );
}
