import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import {
  ArrowLeftRight,
  BarChart3,
  House,
  Package,
  Receipt,
  Settings,
  Tags,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/SettingsContext";
import { useI18n } from "../i18n";
import Logo from "./Logo";

/** Poné en `false` para un menú solo con texto */
const SHOW_ICONS = true;

// `match`: otras rutas en las que esta opción también debe verse activa
type MenuItem = { labelKey: string; href: Href; icon: LucideIcon; match?: string[] };

const ITEMS: MenuItem[] = [
  { labelKey: "nav.home", href: "/dashboard/Home", icon: House },
  { labelKey: "nav.products", href: "/dashboard/Products", icon: Package },
  { labelKey: "nav.categories", href: "/dashboard/Categories", icon: Tags },
  { labelKey: "nav.suppliers", href: "/dashboard/Suppliers", icon: Truck },
  {
    labelKey: "nav.stock",
    href: "/dashboard/Stock",
    icon: ArrowLeftRight,
    // Rutas anteriores que ahora son pestañas de esta pantalla
    match: ["/dashboard/Sales", "/dashboard/Buys", "/dashboard/SpecialStock"],
  },
  { labelKey: "nav.reports", href: "/dashboard/Reports", icon: BarChart3 },
  { labelKey: "nav.clients", href: "/dashboard/Clients", icon: Users },
  { labelKey: "nav.billing", href: "/dashboard/WhiteBill", icon: Receipt },
];

// Abajo del todo: Configuración (tema, idioma, notificaciones) y, al final, Mi cuenta.
// La gestión de usuarios (solo ADMIN) se abre desde Mi cuenta.
const SETTINGS_ITEM: MenuItem = { labelKey: "nav.settings", href: "/dashboard/Settings", icon: Settings };
const ACCOUNT_MATCH = ["/dashboard/Users", "/dashboard/AdminUsers", "/dashboard/EmployeeProfile"];

const isActive = (pathname: string, href: Href, match?: string[]) =>
  href === pathname || !!match?.includes(pathname);

function MenuRow({ item, pathname }: { item: MenuItem; pathname: string }) {
  const { t } = useI18n();
  const theme = useTheme();
  const Icon = item.icon;
  const active = isActive(pathname, item.href, item.match);
  return (
    <TouchableOpacity
      onPress={() => router.push(item.href)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-row items-center rounded-xl mx-3 mb-1 px-3 py-2.5 ${active ? "bg-brand-600" : ""}`}
    >
      {SHOW_ICONS && <Icon color={active ? "#ffffff" : theme.muted} size={19} strokeWidth={1.75} />}
      <Text
        className={`flex-1 text-[15px] ${SHOW_ICONS ? "ml-3" : ""} ${
          active ? "text-white font-semibold" : "text-slate-300 font-medium"
        }`}
        numberOfLines={1}
      >
        {t(item.labelKey)}
      </Text>
      {active && <View className="w-1.5 h-1.5 rounded-full bg-wine-400" />}
    </TouchableOpacity>
  );
}

/** Mi cuenta: la fila de abajo, con la inicial de la persona */
function AccountRow({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const active = ACCOUNT_MATCH.includes(pathname);
  const name = user?.empleado
    ? `${user.empleado.nombre} ${user.empleado.apellido ?? ""}`.trim()
    : user?.username ?? "";
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      onPress={() => router.push("/dashboard/Users")}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-row items-center rounded-xl mx-3 px-3 py-2.5 ${active ? "bg-brand-600" : "bg-slate-700/50"}`}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center ${active ? "bg-white/20" : "bg-wine-600"}`}
      >
        <Text className="text-white font-bold text-sm">{initial}</Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className={`text-[15px] font-semibold ${active ? "text-white" : "text-ink"}`} numberOfLines={1}>
          {t("nav.account")}
        </Text>
        {name ? (
          <Text className={`text-xs ${active ? "text-white/80" : "text-slate-400"}`} numberOfLines={1}>
            {name}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function Menu() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View
      className="bg-slate-800 border-r border-slate-700"
      style={{ width: isMobile ? "100%" : 248, height: "100%" }}
    >
      {/* Logo transparente: se adapta al tema */}
      <TouchableOpacity
        onPress={() => router.push("/dashboard/Home")}
        activeOpacity={0.8}
        className="items-center pt-7 pb-5"
        accessibilityRole="button"
        accessibilityLabel="Pumax"
      >
        <Logo width={150} />
      </TouchableOpacity>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}>
        {ITEMS.map((item) => (
          <MenuRow key={item.labelKey} item={item} pathname={pathname} />
        ))}
      </ScrollView>

      <View className="border-t border-slate-700 pt-3 pb-4">
        <MenuRow item={SETTINGS_ITEM} pathname={pathname} />
        <View className="h-1" />
        <AccountRow pathname={pathname} />
      </View>
    </View>
  );
}
