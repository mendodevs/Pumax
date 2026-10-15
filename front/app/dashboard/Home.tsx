import { useState, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  Minus,
  PackageSearch,
  Receipt,
  Repeat,
  Users,
  Wallet,
} from "lucide-react-native";
import { useInicio } from "../../hooks/useInicio";
import { useMyAccount } from "../../hooks/useMyAccount";
import { fromYmd } from "../../hooks/useResumen";
import { money } from "../../utils/format";
import { colors } from "../../constants/theme";
import { useI18n } from "../../i18n";

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Día de la semana abreviado según el idioma ("Dom" / "Sun") */
const diaCorto = (d: Date, locale: string) =>
  cap(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d).replace(".", ""));

const ESTADO: Record<string, { labelKey: string; pluralKey: string; chip: string; text: string }> = {
  PENDIENTE: { labelKey: "home.status.pending", pluralKey: "home.status.pending.plural", chip: "bg-amber-500/15", text: "text-amber-400" },
  PREPARANDO: { labelKey: "home.status.preparing", pluralKey: "home.status.preparing.plural", chip: "bg-sky-500/15", text: "text-sky-400" },
  LISTO: { labelKey: "home.status.ready", pluralKey: "home.status.ready.plural", chip: "bg-brand-500/20", text: "text-brand-400" },
};

const saludoKey = () => {
  const h = new Date().getHours();
  return h < 6 ? "home.greeting.night" : h < 13 ? "home.greeting.morning" : h < 20 ? "home.greeting.afternoon" : "home.greeting.night";
};

const fechaCorta = (ymd: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric" }).format(fromYmd(ymd));

/* ---------- Piezas ---------- */

function Card({
  title,
  action,
  onAction,
  children,
  className = "",
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`bg-slate-800 border border-slate-700 rounded-2xl p-4 ${className}`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink font-bold text-base">{title}</Text>
        {action && onAction ? (
          <TouchableOpacity onPress={onAction} className="flex-row items-center">
            <Text className="text-brand-400 text-xs font-semibold">{action}</Text>
            <ChevronRight color={colors.brandLight} size={14} />
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const Empty = ({ text }: { text: string }) => <Text className="text-slate-500 text-sm py-2">{text}</Text>;

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  const { t, locale } = useI18n();
  if (before === 0 && now === 0) {
    return (
      <View className="flex-row items-center mt-1">
        <Minus color={colors.muted} size={14} />
        <Text className="text-slate-500 text-xs ml-1">{t("home.delta.noMovement")}</Text>
      </View>
    );
  }
  if (before === 0) return <Text className="text-brand-400 text-xs mt-1">{t("home.delta.noData", { label })}</Text>;
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <View className="flex-row items-center mt-1">
      <Icon color={up ? colors.brandLight : colors.danger} size={14} />
      <Text className={`text-xs ml-0.5 font-semibold ${up ? "text-brand-400" : "text-red-400"}`}>
        {up ? "+" : ""}
        {pct.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}%
      </Text>
      <Text className="text-slate-500 text-xs ml-1">{label}</Text>
    </View>
  );
}

function Stat({
  label,
  value,
  pedidos,
  now,
  before,
  vs,
  width,
  highlight,
}: {
  label: string;
  value: number;
  pedidos: number;
  now: number;
  before: number;
  vs: string;
  width: string;
  highlight?: boolean;
}) {
  const { tn } = useI18n();
  return (
    <View style={{ width: width as any }} className="p-1.5">
      <View
        className={`rounded-2xl p-4 border ${highlight ? "bg-brand-700 border-brand-600" : "bg-slate-800 border-slate-700"}`}
      >
        <Text className={`text-xs ${highlight ? "text-brand-100" : "text-slate-400"}`}>{label}</Text>
        <Text className="text-white font-bold text-2xl mt-1" numberOfLines={1} adjustsFontSizeToFit>
          $ {money(value)}
        </Text>
        <Text className={`text-xs mt-0.5 ${highlight ? "text-brand-100" : "text-slate-400"}`}>
          {tn("home.orders", pedidos)}
        </Text>
        <Delta now={now} before={before} label={vs} />
      </View>
    </View>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onPress,
  primary,
}: {
  icon: typeof Wallet;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-row items-center px-4 py-3 rounded-xl mr-2 mb-2 ${
        primary ? "bg-wine-500" : "bg-white/10 border border-white/20"
      }`}
    >
      <Icon color="#fff" size={18} />
      <Text className="text-white font-semibold text-sm ml-2">{label}</Text>
    </TouchableOpacity>
  );
}

/** Ventas de los últimos 7 días; el día de hoy va en vino */
function WeekBars({ days }: { days: { dia: string; ventas: number }[] }) {
  const { t, locale } = useI18n();
  const max = Math.max(...days.map((d) => d.ventas), 1);
  const total = days.reduce((s, d) => s + d.ventas, 0);
  const [picked, setPicked] = useState<number | null>(null);
  const idx = picked ?? days.length - 1;
  const sel = days[idx];
  const selDate = fromYmd(sel.dia);

  return (
    <View>
      <Text className="text-slate-400 text-xs">
        {picked === null ? t("common.today") : `${diaCorto(selDate, locale)} ${selDate.getDate()}`}
      </Text>
      <Text className="text-ink font-bold text-lg mb-3">
        $ {money(sel.ventas)}{" "}
        <Text className="text-slate-400 text-sm font-normal">· $ {money(total)} {t("home.week.in7days")}</Text>
      </Text>
      <View style={{ height: 120 }} className="flex-row items-end border-b border-slate-700">
        {days.map((d, i) => {
          const h = d.ventas > 0 ? Math.max((d.ventas / max) * 100, 5) : 1.5;
          const active = i === idx;
          return (
            <TouchableOpacity
              key={d.dia}
              activeOpacity={0.7}
              onPress={() => setPicked(i === picked ? null : i)}
              style={{ flex: 1, height: "100%", justifyContent: "flex-end", paddingHorizontal: 5 }}
            >
              <View
                style={{ height: `${h}%` }}
                className={`rounded-t-md ${d.ventas === 0 ? "bg-slate-700" : active ? "bg-wine-500" : "bg-brand-500"}`}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <View className="flex-row mt-2">
        {days.map((d) => (
          <View key={d.dia} style={{ flex: 1, alignItems: "center" }}>
            <Text className="text-slate-400 text-[10px]">{diaCorto(fromYmd(d.dia), locale)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------- Pantalla ---------- */

export default function DashboardHome() {
  const router = useRouter();
  const { t, tn, locale } = useI18n();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { data, loading, error, reload } = useInicio();
  const { account } = useMyAccount();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const hoy = new Date();
  const fechaTexto = t("home.dateLong", {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(hoy),
    day: hoy.getDate(),
    month: new Intl.DateTimeFormat(locale, { month: "long" }).format(hoy),
  });
  const nombre = account?.empleado?.nombre || account?.username || "";
  const statWidth = isMobile ? "100%" : "33.333%";

  const go = (path: string) => router.push(path as any);

  const header = (
    <View className="bg-brand-800 border border-brand-700 rounded-3xl p-5 mb-4 overflow-hidden">
      <View
        style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, borderRadius: 75, opacity: 0.35 }}
        className="bg-wine-500"
      />
      <Text className="text-brand-100 text-sm capitalize">{fechaTexto}</Text>
      <Text className="text-white font-bold text-2xl mt-1">
        {t(saludoKey())}
        {nombre ? `, ${nombre}` : ""}
      </Text>
      <Text className="text-brand-100 text-sm mt-1 mb-4">
        {data
          ? data.pedidos_por_atender.length > 0
            ? tn("home.toAttend", data.pedidos_activos.PENDIENTE + data.pedidos_activos.PREPARANDO + data.pedidos_activos.LISTO)
            : t("home.noPending")
          : t("home.loadingSummary")}
      </Text>
      <View className="flex-row flex-wrap">
        <QuickAction icon={FilePlus2} label={t("home.action.newInvoice")} onPress={() => go("/dashboard/WhiteBill")} primary />
        <QuickAction icon={Repeat} label={t("home.action.stock")} onPress={() => go("/dashboard/Stock")} />
        <QuickAction icon={Users} label={t("home.action.clients")} onPress={() => go("/dashboard/Clients")} />
        <QuickAction icon={BarChart3} label={t("home.action.reports")} onPress={() => go("/dashboard/Reports")} />
      </View>
    </View>
  );

  const body = () => {
    if (error) {
      return (
        <View className="items-center py-16">
          <AlertTriangle color={colors.danger} size={44} />
          <Text className="text-ink text-base mt-4 text-center">{error}</Text>
          <TouchableOpacity onPress={reload} className="bg-brand-500 px-6 py-3 rounded-xl mt-4">
            <Text className="text-white font-semibold">{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!data) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color={colors.brandLight} />
        </View>
      );
    }

    const act = data.pedidos_activos;
    const totalActivos = act.PENDIENTE + act.PREPARANDO + act.LISTO;

    return (
      <View style={{ opacity: loading && !refreshing ? 0.5 : 1 }}>
        {/* Ventas: hoy, semana, mes */}
        <View className="flex-row flex-wrap -mx-1.5">
          <Stat label={t("home.stat.today")} value={data.hoy.ventas} pedidos={data.hoy.pedidos} now={data.hoy.ventas} before={data.hoy.anterior.ventas} vs={t("home.vs.yesterday")} width={statWidth} highlight />
          <Stat label={t("home.stat.week")} value={data.semana.ventas} pedidos={data.semana.pedidos} now={data.semana.ventas} before={data.semana.anterior.ventas} vs={t("home.vs.lastWeek")} width={statWidth} />
          <Stat label={t("home.stat.month")} value={data.mes.ventas} pedidos={data.mes.pedidos} now={data.mes.ventas} before={data.mes.anterior.ventas} vs={t("home.vs.lastMonth")} width={statWidth} />
        </View>

        <View className={isMobile ? "" : "flex-row"}>
          {/* Columna izquierda */}
          <View className={isMobile ? "" : "flex-1 mr-2"}>
            <Card title={t("home.card.last7")} action={t("home.card.viewReports")} onAction={() => go("/dashboard/Reports")} className="mt-3">
              <WeekBars days={data.ultimos_7_dias} />
            </Card>

            <Card title={t("home.card.ordersToAttend")} className="mt-3">
              {totalActivos > 0 && (
                <View className="flex-row mb-3">
                  {(["PENDIENTE", "PREPARANDO", "LISTO"] as const).map((e) => (
                    <View key={e} className={`flex-1 rounded-xl p-3 mr-2 ${ESTADO[e].chip}`}>
                      <Text className={`font-bold text-xl ${ESTADO[e].text}`}>{act[e]}</Text>
                      <Text className="text-slate-300 text-xs">{t(ESTADO[e].pluralKey)}</Text>
                    </View>
                  ))}
                </View>
              )}
              {data.pedidos_por_atender.length === 0 ? (
                <Empty text={t("home.empty.noPendingOrders")} />
              ) : (
                data.pedidos_por_atender.map((p, i) => (
                  <View
                    key={p.id}
                    className={`flex-row items-center py-2.5 ${i > 0 ? "border-t border-slate-700" : ""}`}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                        {p.cliente}
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        {p.numero ? `#${p.numero} · ` : ""}
                        {fechaCorta(p.fecha, locale)}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-md mr-3 ${ESTADO[p.estado].chip}`}>
                      <Text className={`text-[11px] font-semibold ${ESTADO[p.estado].text}`}>{t(ESTADO[p.estado].labelKey)}</Text>
                    </View>
                    <Text className="text-slate-200 text-sm font-semibold">$ {money(p.total)}</Text>
                  </View>
                ))
              )}
            </Card>
          </View>

          {/* Columna derecha */}
          <View className={isMobile ? "" : "flex-1 ml-2"}>
            <Card
              title={t("home.card.lowStock")}
              action={t("home.card.viewProducts")}
              onAction={() => go("/dashboard/Products")}
              className="mt-3"
            >
              {data.stock_bajo.total === 0 ? (
                <View className="flex-row items-center py-2">
                  <PackageSearch color={colors.brandLight} size={20} />
                  <Text className="text-slate-300 text-sm ml-2">{t("home.stock.allGood")}</Text>
                </View>
              ) : (
                <>
                  <Text className="text-slate-400 text-xs mb-2">
                    {tn("home.stock.atMinimum", data.stock_bajo.total)}
                    {data.stock_bajo.agotados > 0 ? ` · ${t("home.stock.outCount", { n: data.stock_bajo.agotados })}` : ""}
                  </Text>
                  {data.stock_bajo.items.map((p, i) => {
                    const agotado = p.stock <= 0;
                    return (
                      <View
                        key={p.id}
                        className={`flex-row items-center py-2.5 ${i > 0 ? "border-t border-slate-700" : ""}`}
                      >
                        <View className="flex-1 pr-2">
                          <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                            {p.descripcion}
                          </Text>
                          <Text className="text-slate-500 text-xs">
                            {p.codigo} · {t("home.stock.minimum", { n: p.minimo })}
                          </Text>
                        </View>
                        <View className={`px-2.5 py-1 rounded-md ${agotado ? "bg-red-500/15" : "bg-amber-500/15"}`}>
                          <Text className={`text-xs font-bold ${agotado ? "text-red-400" : "text-amber-400"}`}>
                            {agotado ? t("home.stock.outOfStock") : t("home.stock.units", { n: p.stock })}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </Card>

            <Card title={t("home.card.lastInvoices")} action={t("home.card.invoice")} onAction={() => go("/dashboard/WhiteBill")} className="mt-3">
              {data.ultimas_facturas.length === 0 ? (
                <Empty text={t("home.empty.noInvoices")} />
              ) : (
                data.ultimas_facturas.map((f, i) => (
                  <View
                    key={f.id}
                    className={`flex-row items-center py-2.5 ${i > 0 ? "border-t border-slate-700" : ""}`}
                  >
                    <View className="w-9 h-9 rounded-lg bg-slate-700 items-center justify-center mr-3">
                      <Receipt color={f.estado === "ANULADA" ? colors.danger : colors.brandLight} size={16} />
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                        {f.cliente}
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        {f.tipo ? t("home.invoice.typed", { tipo: f.tipo }) : t("home.invoice.plain")}
                        {f.numero ? ` · ${f.numero}` : ""} · {fechaCorta(f.fecha, locale)}
                        {f.estado === "ANULADA" ? ` · ${t("home.invoice.void")}` : ""}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm font-semibold ${f.estado === "ANULADA" ? "text-slate-500 line-through" : "text-slate-200"}`}
                    >
                      $ {money(f.total)}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            <TouchableOpacity activeOpacity={0.85} onPress={() => go("/dashboard/Clients")} className="mt-3">
              <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex-row items-center">
                <View className="w-11 h-11 rounded-xl bg-wine-700 items-center justify-center mr-3">
                  <ClipboardList color="#fff" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs">{t("home.debt.title")}</Text>
                  <Text className="text-ink font-bold text-lg">$ {money(data.deuda_clientes.monto)}</Text>
                  <Text className="text-slate-500 text-xs">
                    {data.deuda_clientes.clientes === 0
                      ? t("home.debt.none")
                      : tn("home.debt.clients", data.deuda_clientes.clientes)}
                  </Text>
                </View>
                <ChevronRight color={colors.muted} size={18} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-slate-900"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandLight} />}
        contentContainerStyle={{
          width: "100%",
          maxWidth: 1100,
          alignSelf: "center",
          paddingHorizontal: 16,
          paddingTop: isMobile ? 72 : 24,
          paddingBottom: 32,
        }}
      >
        {header}
        {body()}
      </ScrollView>
    </>
  );
}
