import { useMemo, useState, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react-native";
import { useResumen, fromYmd } from "../../hooks/useResumen";
import type { ResumenData } from "../../services/reports.service";
import { money, int } from "../../utils/format";
import { colors } from "../../constants/theme";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Día de la semana abreviado según el idioma ("Dom" / "Sun") */
const diaCorto = (d: Date, locale: string) =>
  cap(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d).replace(".", ""));

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Rótulo del período armado en el front: semana → rango, mes → "octubre de 2026" */
function periodLabel(periodo: ResumenData["periodo"], t: Translate, locale: string, lang: string) {
  const from = fromYmd(periodo.desde);
  if (periodo.tipo !== "semana") {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(from);
  }
  const to = fromYmd(periodo.hasta);
  const monthOf = (d: Date) =>
    new Intl.DateTimeFormat(locale, { month: lang === "en" ? "short" : "long" }).format(d).replace(".", "");
  if (from.getFullYear() !== to.getFullYear()) {
    return t("reports.period.crossYear", {
      d1: from.getDate(), m1: monthOf(from), y1: from.getFullYear(),
      d2: to.getDate(), m2: monthOf(to), y2: to.getFullYear(),
    });
  }
  if (from.getMonth() !== to.getMonth()) {
    return t("reports.period.crossMonth", {
      d1: from.getDate(), m1: monthOf(from), d2: to.getDate(), m2: monthOf(to), year: to.getFullYear(),
    });
  }
  return t("reports.period.sameMonth", {
    d1: from.getDate(), d2: to.getDate(), month: monthOf(to), year: to.getFullYear(),
  });
}

const ESTADOS: Record<string, { labelKey: string; bar: string }> = {
  PENDIENTE: { labelKey: "reports.status.PENDIENTE", bar: "bg-amber-500" },
  PREPARANDO: { labelKey: "reports.status.PREPARANDO", bar: "bg-sky-500" },
  LISTO: { labelKey: "reports.status.LISTO", bar: "bg-brand-400" },
  ENTREGADO: { labelKey: "reports.status.ENTREGADO", bar: "bg-brand-600" },
  CANCELADO: { labelKey: "reports.status.CANCELADO", bar: "bg-red-500" },
};

/* ---------- Piezas ---------- */

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <View className={`bg-slate-800 border border-slate-700 rounded-2xl p-4 ${className}`}>
      <Text className="text-ink font-bold text-base mb-3">{title}</Text>
      {children}
    </View>
  );
}

const Empty = ({ text }: { text: string }) => <Text className="text-slate-500 text-sm py-2">{text}</Text>;

/** Variación contra el período anterior */
function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  const { t, locale } = useI18n();
  const theme = useTheme();
  if (before === 0 && now === 0) {
    return (
      <View className="flex-row items-center mt-1">
        <Minus color={theme.muted} size={14} />
        <Text className="text-slate-500 text-xs ml-1">{t("reports.delta.noData", { label })}</Text>
      </View>
    );
  }
  if (before === 0) {
    return <Text className="text-brand-400 text-xs mt-1">{t("reports.delta.new", { label })}</Text>;
  }
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

function Kpi({
  icon: Icon,
  label,
  value,
  now,
  before,
  vs,
  width,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  now: number;
  before: number;
  vs: string;
  width: string;
}) {
  return (
    <View style={{ width: width as any }} className="p-1.5">
      <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-lg bg-brand-700 items-center justify-center mr-2">
            <Icon color={colors.wineLight} size={16} />
          </View>
          <Text className="text-slate-400 text-xs flex-1" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text className="text-ink font-bold text-xl" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Delta now={now} before={before} label={vs} />
      </View>
    </View>
  );
}

/** Barras de ventas por día. Tocar una barra muestra su detalle. */
function SalesChart({ data }: { data: ResumenData }) {
  const { t, tn, locale } = useI18n();
  const { serie, periodo } = data;
  const max = Math.max(...serie.map((s) => s.ventas), 1);
  const best = serie.reduce((bi, s, i) => (s.ventas > serie[bi].ventas ? i : bi), 0);
  const [picked, setPicked] = useState<number | null>(null);
  const idx = picked ?? best;
  const sel = serie[idx];
  const isWeek = periodo.tipo === "semana";
  const hasSales = serie.some((s) => s.ventas > 0);
  const selDate = fromYmd(sel.dia);

  return (
    <View>
      <View className="mb-3 min-h-[40px]">
        {hasSales ? (
          <>
            <Text className="text-slate-400 text-xs">
              {picked === null ? t("reports.chart.bestDay") : t("reports.chart.selectedDay")} · {diaCorto(selDate, locale)} {selDate.getDate()}
            </Text>
            <Text className="text-ink font-bold text-lg">
              {money(sel.ventas)}{" "}
              <Text className="text-slate-400 text-sm font-normal">
                · {tn("reports.order", sel.pedidos)}
              </Text>
            </Text>
          </>
        ) : (
          <Text className="text-slate-500 text-sm">{t("reports.chart.noSales")}</Text>
        )}
      </View>

      <View style={{ height: 150 }} className="flex-row items-end border-b border-slate-700">
        {serie.map((s, i) => {
          const h = s.ventas > 0 ? Math.max((s.ventas / max) * 100, 4) : 1.5;
          const active = i === idx && hasSales;
          return (
            <TouchableOpacity
              key={s.dia}
              activeOpacity={0.7}
              onPress={() => setPicked(i === picked ? null : i)}
              style={{ flex: 1, height: "100%", justifyContent: "flex-end", paddingHorizontal: isWeek ? 6 : 1 }}
            >
              <View
                style={{ height: `${h}%` }}
                className={`rounded-t-md ${s.ventas === 0 ? "bg-slate-700" : active ? "bg-wine-500" : "bg-brand-500"}`}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-row mt-2">
        {serie.map((s, i) => {
          const d = fromYmd(s.dia);
          const show = isWeek || i === 0 || (d.getDate() % 5 === 0 && i < serie.length - 2);
          return (
            <View key={s.dia} style={{ flex: 1, alignItems: "center" }}>
              {show && (
                <Text className="text-slate-400 text-[10px]" numberOfLines={1}>
                  {isWeek ? diaCorto(d, locale) : d.getDate()}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Lista de filas con barra proporcional */
function BarList({ rows, tone = "bg-brand-500" }: { rows: { key: string; label: string; sub?: string; value: number; text: string }[]; tone?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View>
      {rows.map((r) => (
        <View key={r.key} className="mb-3">
          <View className="flex-row justify-between items-baseline mb-1">
            <Text className="text-ink text-sm flex-1 pr-2" numberOfLines={1}>
              {r.label}
            </Text>
            <Text className="text-slate-200 text-sm font-semibold">{r.text}</Text>
          </View>
          <View className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <View style={{ width: `${(r.value / max) * 100}%` }} className={`h-2 rounded-full ${tone}`} />
          </View>
          {r.sub ? <Text className="text-slate-500 text-xs mt-1">{r.sub}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/* ---------- Pantalla ---------- */

export default function Reports() {
  const { t, tn, locale, lang } = useI18n();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { tipo, setTipo, shift, goToday, data, loading, error, reload } = useResumen();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const vs = tipo === "semana" ? t("reports.vsWeek") : t("reports.vsMonth");
  const kpiWidth = isMobile ? "50%" : "25%";

  const estadoTotal = useMemo(() => (data ? data.por_estado.reduce((a, e) => a + e.cantidad, 0) : 0), [data]);

  const nav = (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1 pr-3">
          <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
            <BarChart3 color={colors.wineLight} size={22} />
          </View>
          <View>
            <Text className="text-2xl font-bold text-ink">{t("reports.title")}</Text>
            <Text className="text-slate-400 text-sm">{t("reports.subtitle")}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-4 flex-wrap">
        {/* Semana / Mes */}
        <View className="flex-row bg-slate-800 border border-slate-700 rounded-xl p-1 mb-2">
          {(["semana", "mes"] as const).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setTipo(k)}
              className={`px-5 py-2 rounded-lg ${tipo === k ? "bg-brand-500" : ""}`}
            >
              <Text className={`font-semibold ${tipo === k ? "text-white" : "text-slate-300"}`}>
                {k === "semana" ? t("reports.weekly") : t("reports.monthly")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navegación de período */}
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => shift(-1)} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
            <ChevronLeft color={colors.brandLight} size={20} />
          </TouchableOpacity>
          <Text className="text-ink font-semibold mx-3 capitalize" style={{ minWidth: isMobile ? 130 : 220, textAlign: "center" }}>
            {data ? periodLabel(data.periodo, t, locale, lang) : "…"}
          </Text>
          <TouchableOpacity onPress={() => shift(1)} className="p-2 rounded-lg bg-slate-800 border border-slate-700">
            <ChevronRight color={colors.brandLight} size={20} />
          </TouchableOpacity>
          {data && !data.periodo.es_actual && (
            <TouchableOpacity onPress={goToday} className="ml-2 px-3 py-2 rounded-lg bg-wine-600/20">
              <Text className="text-wine-400 text-xs font-bold">{t("common.today")}</Text>
            </TouchableOpacity>
          )}
        </View>
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
        <View className="items-center py-20">
          <ActivityIndicator size="large" color={colors.brandLight} />
          <Text className="text-ink mt-4">{t("reports.loading")}</Text>
        </View>
      );
    }

    const a = data.actual;
    const b = data.anterior;
    const mov = data.movimientos_stock;
    const tipoTotal = data.por_tipo.reduce((s, t) => s + t.ventas, 0);

    return (
      <View style={{ opacity: loading ? 0.5 : 1 }}>
        {/* KPIs */}
        <View className="flex-row flex-wrap -mx-1.5 mb-2">
          <Kpi icon={Wallet} label={t("reports.kpi.sales")} value={money(a.ventas)} now={a.ventas} before={b.ventas} vs={vs} width={kpiWidth} />
          <Kpi icon={ShoppingCart} label={t("reports.kpi.orders")} value={int(a.pedidos)} now={a.pedidos} before={b.pedidos} vs={vs} width={kpiWidth} />
          <Kpi icon={Receipt} label={t("reports.kpi.avgTicket")} value={money(a.ticket_promedio)} now={a.ticket_promedio} before={b.ticket_promedio} vs={vs} width={kpiWidth} />
          <Kpi icon={TrendingUp} label={t("reports.kpi.estProfit")} value={money(a.ganancia_estimada)} now={a.ganancia_estimada} before={b.ganancia_estimada} vs={vs} width={kpiWidth} />
          <Kpi icon={Receipt} label={t("reports.kpi.invoiced", { n: a.facturas })} value={money(a.facturado)} now={a.facturado} before={b.facturado} vs={vs} width={kpiWidth} />
          <Kpi icon={Package} label={t("reports.kpi.units")} value={int(a.unidades)} now={a.unidades} before={b.unidades} vs={vs} width={kpiWidth} />
          <Kpi icon={Users} label={t("reports.kpi.customers")} value={int(a.clientes)} now={a.clientes} before={b.clientes} vs={vs} width={kpiWidth} />
          <View style={{ width: kpiWidth as any }} className="p-1.5">
            <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 h-full">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-lg bg-wine-700 items-center justify-center mr-2">
                  <AlertTriangle color="#fff" size={16} />
                </View>
                <Text className="text-slate-400 text-xs flex-1">{t("reports.kpi.stockToday")}</Text>
              </View>
              <Text className="text-ink font-bold text-xl">{data.stock_actual.bajo + data.stock_actual.agotado}</Text>
              <Text className="text-slate-500 text-xs mt-1">
                {t("reports.kpi.stockDetail", { out: data.stock_actual.agotado, low: data.stock_actual.bajo })}
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico */}
        <Card title={t("reports.chart.title")} className="mt-2">
          <SalesChart key={`${data.periodo.desde}-${data.periodo.tipo}`} data={data} />
        </Card>

        {/* Dos columnas en escritorio */}
        <View className={isMobile ? "" : "flex-row"}>
          <View className={isMobile ? "" : "flex-1 mr-2"}>
            <Card title={t("reports.card.topProducts")} className="mt-3">
              {data.top_productos.length === 0 ? (
                <Empty text={t("reports.empty.noSales")} />
              ) : (
                <BarList
                  rows={data.top_productos.map((p) => ({
                    key: String(p.id),
                    label: p.descripcion,
                    sub: `${p.codigo} · ${money(p.monto)}`,
                    value: p.unidades,
                    text: t("reports.unitsShort", { n: int(p.unidades) }),
                  }))}
                />
              )}
            </Card>

            <Card title={t("reports.card.byCategory")} className="mt-3">
              {data.por_categoria.length === 0 ? (
                <Empty text={t("reports.empty.noSales")} />
              ) : (
                <BarList
                  tone="bg-wine-500"
                  rows={data.por_categoria.map((c) => ({
                    key: c.categoria,
                    label: c.categoria,
                    value: c.monto,
                    text: money(c.monto),
                  }))}
                />
              )}
            </Card>
          </View>

          <View className={isMobile ? "" : "flex-1 ml-2"}>
            <Card title={t("reports.card.topCustomers")} className="mt-3">
              {data.top_clientes.length === 0 ? (
                <Empty text={t("reports.empty.noSales")} />
              ) : (
                <BarList
                  rows={data.top_clientes.map((c) => ({
                    key: String(c.id),
                    label: c.nombre,
                    sub: tn("reports.order", c.pedidos),
                    value: c.monto,
                    text: money(c.monto),
                  }))}
                />
              )}
            </Card>

            <Card title={t("reports.card.orderStatus")} className="mt-3">
              {estadoTotal === 0 ? (
                <Empty text={t("reports.empty.noOrders")} />
              ) : (
                <BarList
                  rows={data.por_estado.map((e) => ({
                    key: e.estado,
                    label: ESTADOS[e.estado] ? t(ESTADOS[e.estado].labelKey) : e.estado,
                    value: e.cantidad,
                    text: String(e.cantidad),
                  }))}
                />
              )}
            </Card>

            <Card title={t("reports.card.operations")} className="mt-3">
              {tipoTotal > 0 && (
                <View className="mb-4">
                  <View className="flex-row h-3 rounded-full overflow-hidden bg-slate-700">
                    {data.por_tipo.map((t) => (
                      <View
                        key={t.tipo}
                        style={{ flex: t.ventas }}
                        className={t.tipo === "BLANCO" ? "bg-brand-500" : "bg-wine-500"}
                      />
                    ))}
                  </View>
                  <View className="flex-row justify-between mt-2">
                    {data.por_tipo.map((pt) => (
                      <Text key={pt.tipo} className="text-slate-300 text-xs">
                        <Text className={pt.tipo === "BLANCO" ? "text-brand-400" : "text-wine-400"}>● </Text>
                        {pt.tipo === "BLANCO" ? t("reports.type.BLANCO") : t("reports.type.NEGRO")} · {Math.round((pt.ventas / tipoTotal) * 100)}% ·{" "}
                        {money(pt.ventas)}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
              <View className="flex-row">
                {(
                  [
                    ["reports.mov.in", mov.ENTRADA],
                    ["reports.mov.out", mov.SALIDA],
                    ["reports.mov.adjust", mov.AJUSTE],
                  ] as const
                ).map(([labelKey, m]) => (
                  <View key={labelKey} className="flex-1 bg-slate-900 rounded-xl p-3 mx-1">
                    <Text className="text-slate-400 text-xs">{t(labelKey)}</Text>
                    <Text className="text-ink font-bold text-lg">{int(m.unidades)}</Text>
                    <Text className="text-slate-500 text-xs">{t("reports.movShort", { n: m.movimientos })}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </View>

        <Text className="text-slate-500 text-xs mt-4 text-center">
          {t("reports.footnote")}
        </Text>
      </View>
    );
  };

  return (
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
      {nav}
      {body()}
    </ScrollView>
  );
}
