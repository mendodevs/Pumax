import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../context/SettingsContext";
import { getAlertas, type Alertas } from "../services/alertas.service";
import { getPermission, onNotificationOpen, showNotification } from "../services/notify";
import { translate, translatePlural } from "../i18n/core";

const BASELINE_KEY = "pumax_alert_baseline";
const INTERVAL_MS = 60_000;

/** Olvida el último estado conocido: la próxima consulta lo toma como punto de partida sin avisar */
export const resetAlertBaseline = () => AsyncStorage.removeItem(BASELINE_KEY).catch(() => {});

/**
 * Consulta cada minuto los pedidos pendientes y el stock bajo, y avisa cuando aumentan.
 * Funciona mientras la app (o la PWA) esté abierta; se monta una sola vez en el layout del dashboard.
 * La primera consulta solo guarda el punto de partida, así no se notifica lo que ya existía.
 */
export function useAlertWatcher() {
  const { settings } = useSettings();
  const prefs = useRef(settings.notifications);
  prefs.current = settings.notifications;
  const enabled = settings.notifications.enabled;

  // Tocar una notificación en el celular lleva a la pantalla correspondiente
  useEffect(() => onNotificationOpen((url) => router.push(url as any)), []);

  useEffect(() => {
    if (!enabled) return;
    let running = false;
    let cancelled = false;

    const tick = async () => {
      if (running || cancelled) return;
      running = true;
      try {
        if ((await getPermission()) !== "granted") return;
        const now = await getAlertas();
        const raw = await AsyncStorage.getItem(BASELINE_KEY);
        await AsyncStorage.setItem(BASELINE_KEY, JSON.stringify(now));
        if (!raw || cancelled) return;
        const before = JSON.parse(raw) as Alertas;
        const p = prefs.current;

        if (p.orders && now.pedidos_pendientes > before.pedidos_pendientes) {
          const nuevos = now.pedidos_pendientes - before.pedidos_pendientes;
          await showNotification(
            translatePlural("notif.orders.title", nuevos),
            translatePlural("notif.orders.body", now.pedidos_pendientes),
            { tag: "pedidos", url: "/dashboard/Stock?tab=ventas" }
          );
        }
        if (p.stock && now.stock_bajo > before.stock_bajo) {
          const extra = now.agotados > 0 ? ` ${translatePlural("notif.stock.empty", now.agotados)}` : "";
          await showNotification(
            translate("notif.stock.title"),
            `${translatePlural("notif.stock.body", now.stock_bajo)}${extra}`,
            { tag: "stock", url: "/dashboard/Products" }
          );
        }
      } catch {
        // sin conexión o sesión vencida: se reintenta en el próximo ciclo
      } finally {
        running = false;
      }
    };

    tick();
    const id = setInterval(tick, INTERVAL_MS);
    const sub = AppState.addEventListener("change", (s) => s === "active" && tick());
    return () => {
      cancelled = true;
      clearInterval(id);
      sub.remove();
    };
  }, [enabled]);
}
