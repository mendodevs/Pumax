import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, View, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars } from "nativewind";
import { cssVars, type ThemeMode } from "../constants/palette";
import { setCurrentLang, type Lang } from "../i18n/core";

/**
 * Ajustes de la app: tema, idioma y notificaciones.
 * Se guardan en el dispositivo (AsyncStorage; en la web, localStorage) y se aplican al instante.
 */
export type ThemePref = "light" | "dark" | "system";

export interface NotificationPrefs {
  enabled: boolean; // interruptor general
  orders: boolean; // pedidos nuevos pendientes
  stock: boolean; // productos con stock bajo
}

export interface Settings {
  theme: ThemePref;
  language: Lang;
  notifications: NotificationPrefs;
}

export const STORAGE_KEY = "pumax_settings";

const DEFAULTS: Settings = {
  theme: "dark",
  language: "es",
  notifications: { enabled: false, orders: true, stock: true },
};

interface SettingsContextType {
  settings: Settings;
  mode: ThemeMode; // tema ya resuelto (si es "system", el del dispositivo)
  setTheme: (t: ThemePref) => void;
  setLanguage: (l: Lang) => void;
  setNotifications: (patch: Partial<NotificationPrefs>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function parse(raw: string | null): Settings {
  if (!raw) return DEFAULTS;
  try {
    const p = JSON.parse(raw);
    return {
      theme: ["light", "dark", "system"].includes(p.theme) ? p.theme : DEFAULTS.theme,
      language: p.language === "en" ? "en" : "es",
      notifications: { ...DEFAULTS.notifications, ...(p.notifications || {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSettings(parse(raw)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: (s: Settings) => Settings) => {
    setSettings((prev) => {
      const next = patch(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const mode: ThemeMode = settings.theme === "system" ? (scheme === "light" ? "light" : "dark") : settings.theme;

  // El idioma se fija en el render para que `translate()` (fuera de React) ya lo use
  setCurrentLang(settings.language);

  // Web: el tema vive en <html data-theme> para que también lo hereden los modales (portales)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.dataset.theme = mode;
    document.documentElement.lang = settings.language;
  }, [mode, settings.language]);

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      mode,
      setTheme: (theme) => update((s) => ({ ...s, theme })),
      setLanguage: (language) => update((s) => ({ ...s, language })),
      setNotifications: (patch) => update((s) => ({ ...s, notifications: { ...s.notifications, ...patch } })),
    }),
    [settings, mode, update]
  );

  // Esperamos a leer lo guardado para no mostrar un destello del tema equivocado
  if (!ready) return null;

  return (
    <SettingsContext.Provider value={value}>
      {/* En nativo las variables de color se inyectan acá; en la web salen del CSS de <html> */}
      <View style={Platform.OS === "web" ? { flex: 1 } : [{ flex: 1 }, vars(cssVars(mode))]}>{children}</View>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings debe usarse dentro de SettingsProvider");
  return ctx;
}

/** Colores sueltos para props que no aceptan className (íconos, spinners, placeholders) */
export function useTheme() {
  const { mode } = useSettings();
  return useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      ink: mode === "dark" ? "#ffffff" : "#131a16",
      muted: mode === "dark" ? "#8a9a91" : "#627269",
      accent: mode === "dark" ? "#45bd66" : "#158a33",
      accentWine: mode === "dark" ? "#e0507d" : "#ae2151",
      placeholder: mode === "dark" ? "#6b7c73" : "#7d8c83",
    }),
    [mode]
  );
}
