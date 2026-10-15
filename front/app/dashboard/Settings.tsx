import { useEffect, useState, type ReactNode } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, Platform, useWindowDimensions } from "react-native";
import {
  Bell,
  BellRing,
  Check,
  Info,
  Languages,
  Monitor,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react-native";
import { useSettings, useTheme, type ThemePref } from "../../context/SettingsContext";
import { LANGUAGES, translate } from "../../i18n/core";
import { useI18n } from "../../i18n";
import { useNotice } from "../../hooks/useNotice";
import { resetAlertBaseline } from "../../hooks/useAlertWatcher";
import NoticeBanner from "../../components/NoticeBanner";
import { getPermission, requestPermission, showNotification, type PermissionState } from "../../services/notify";
import { colors } from "../../constants/theme";

/* ---------- Piezas ---------- */

function Card({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Sun;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-1">
        <View className="w-9 h-9 rounded-lg bg-brand-700 items-center justify-center mr-3">
          <Icon color={colors.wineLight} size={18} />
        </View>
        <Text className="text-ink font-bold text-base flex-1">{title}</Text>
      </View>
      {desc ? <Text className="text-slate-400 text-sm mb-3 ml-12">{desc}</Text> : <View className="mb-3" />}
      {children}
    </View>
  );
}

function Row({
  title,
  desc,
  value,
  onChange,
  disabled,
  first,
}: {
  title: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  first?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      className={`flex-row items-center py-3 ${first ? "" : "border-t border-slate-700"}`}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-ink text-sm font-semibold">{title}</Text>
        {desc ? <Text className="text-slate-400 text-xs mt-0.5">{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: theme.isDark ? "#34433b" : "#cbd5cf", true: theme.accent }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const THEMES: { key: ThemePref; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "settings.theme.light" },
  { key: "dark", icon: Moon, label: "settings.theme.dark" },
  { key: "system", icon: Monitor, label: "settings.theme.system" },
];

const PERM_STYLE: Record<PermissionState, { chip: string; text: string }> = {
  granted: { chip: "bg-brand-500/15", text: "text-brand-400" },
  default: { chip: "bg-slate-700", text: "text-slate-300" },
  denied: { chip: "bg-red-500/15", text: "text-red-400" },
  unsupported: { chip: "bg-amber-500/15", text: "text-amber-400" },
};

/* ---------- Pantalla ---------- */

export default function Settings() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { t } = useI18n();
  const theme = useTheme();
  const { settings, setTheme, setLanguage, setNotifications } = useSettings();
  const { notice, showNotice } = useNotice();
  const [perm, setPerm] = useState<PermissionState>("default");

  const n = settings.notifications;

  useEffect(() => {
    getPermission().then(setPerm);
  }, []);

  // El permiso se pide directo desde el toque (los navegadores lo exigen)
  const toggleMaster = async (on: boolean) => {
    if (!on) {
      setNotifications({ enabled: false });
      showNotice("info", t("settings.notif.off"));
      return;
    }
    const result = await requestPermission();
    setPerm(result);
    if (result === "granted") {
      await resetAlertBaseline(); // solo avisa de lo que pase desde ahora
      setNotifications({ enabled: true });
      showNotice("success", t("settings.notif.on"));
    } else {
      setNotifications({ enabled: false });
      showNotice("error", t(helpKey(result)));
    }
  };

  const sendTest = async () => {
    let state = perm;
    if (state !== "granted") {
      state = await requestPermission();
      setPerm(state);
    }
    if (state !== "granted") {
      showNotice("error", t(helpKey(state)));
      return;
    }
    await showNotification(translate("notif.test.title"), translate("notif.test.body"), {
      tag: "test",
      url: "/dashboard/Settings",
    });
    showNotice("success", t("settings.notif.testSent"));
  };

  const helpKey = (state: PermissionState) =>
    state === "unsupported"
      ? "settings.notif.unsupportedHelp"
      : Platform.OS === "web"
      ? "settings.notif.deniedHelpWeb"
      : "settings.notif.deniedHelpApp";

  const showHelp = perm === "denied" || perm === "unsupported";

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      contentContainerStyle={{
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingTop: isMobile ? 72 : 24,
        paddingBottom: 32,
      }}
    >
      <View className="flex-row items-center mb-5">
        <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
          <SettingsIcon color={colors.wineLight} size={22} />
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-ink">{t("settings.title")}</Text>
          <Text className="text-slate-400 text-sm">{t("settings.subtitle")}</Text>
        </View>
      </View>

      <NoticeBanner notice={notice} />

      {/* Apariencia */}
      <Card icon={Palette} title={t("settings.appearance")} desc={t("settings.appearance.desc")}>
        <View className="flex-row -mx-1">
          {THEMES.map(({ key, icon: Icon, label }) => {
            const selected = settings.theme === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => setTheme(key)}
                className="flex-1 px-1"
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View
                  className={`items-center rounded-xl border-2 py-4 ${
                    selected ? "border-brand-500 bg-brand-500/10" : "border-slate-700 bg-slate-900"
                  }`}
                >
                  <Icon color={selected ? theme.accent : theme.muted} size={22} />
                  <Text className={`text-sm font-semibold mt-2 ${selected ? "text-ink" : "text-slate-300"}`}>
                    {t(label)}
                  </Text>
                  <View className="h-4 mt-1 items-center justify-center">
                    {selected ? <Check color={theme.accent} size={14} /> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {settings.theme === "system" && (
          <Text className="text-slate-400 text-xs mt-3">{t("settings.theme.systemHint")}</Text>
        )}
      </Card>

      {/* Idioma */}
      <Card icon={Languages} title={t("settings.language")} desc={t("settings.language.desc")}>
        {LANGUAGES.map((l, i) => {
          const selected = settings.language === l.code;
          return (
            <TouchableOpacity
              key={l.code}
              activeOpacity={0.8}
              onPress={() => setLanguage(l.code)}
              className={`flex-row items-center py-3 ${i > 0 ? "border-t border-slate-700" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View className="w-9 h-9 rounded-lg bg-slate-700 items-center justify-center mr-3">
                <Text className="text-ink text-xs font-bold">{l.short}</Text>
              </View>
              <Text className="text-ink text-sm font-semibold flex-1">{l.label}</Text>
              {selected ? <Check color={theme.accent} size={18} /> : null}
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Notificaciones */}
      <Card icon={Bell} title={t("settings.notif")} desc={t("settings.notif.desc")}>
        <View className="flex-row items-center mb-2">
          <View className={`px-2.5 py-1 rounded-md ${PERM_STYLE[perm].chip}`}>
            <Text className={`text-xs font-semibold ${PERM_STYLE[perm].text}`}>
              {t(`settings.notif.status.${perm}`)}
            </Text>
          </View>
        </View>
        {showHelp && <Text className="text-slate-400 text-xs mb-1">{t(helpKey(perm))}</Text>}

        <Row first title={t("settings.notif.master")} value={n.enabled} onChange={toggleMaster} />
        <Row
          title={t("settings.notif.orders")}
          desc={t("settings.notif.ordersDesc")}
          value={n.orders}
          disabled={!n.enabled}
          onChange={(v) => setNotifications({ orders: v })}
        />
        <Row
          title={t("settings.notif.stock")}
          desc={t("settings.notif.stockDesc")}
          value={n.stock}
          disabled={!n.enabled}
          onChange={(v) => setNotifications({ stock: v })}
        />

        <TouchableOpacity
          onPress={sendTest}
          activeOpacity={0.85}
          className="flex-row items-center justify-center rounded-xl border border-slate-600 py-3 mt-3"
        >
          <BellRing color={theme.accent} size={18} />
          <Text className="text-ink text-sm font-semibold ml-2">{t("settings.notif.test")}</Text>
        </TouchableOpacity>
        <Text className="text-slate-500 text-xs mt-3">{t("settings.notif.scope")}</Text>
      </Card>

      {/* Acerca de */}
      <Card icon={Info} title={t("settings.about")}>
        {[
          [t("settings.version"), "1.0.0"],
          [t("settings.platform"), "Expo / React Native"],
          [t("settings.developedBy"), "MendoDevs"],
        ].map(([label, value], i) => (
          <View key={label} className={`flex-row justify-between py-2.5 ${i > 0 ? "border-t border-slate-700" : ""}`}>
            <Text className="text-slate-400 text-sm">{label}</Text>
            <Text className="text-ink text-sm font-medium">{value}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
