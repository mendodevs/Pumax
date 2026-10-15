/**
 * Notificaciones en celular (iOS/Android) con expo-notifications.
 * La versión web está en notify.web.ts: Metro elige una u otra según la plataforma.
 * Son notificaciones locales: las dispara la app cuando detecta novedades (ver useAlertWatcher).
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { NotifyOptions, PermissionState } from "./notify.types";

export type { NotifyOptions, PermissionState } from "./notify.types";

const CHANNEL = "alerts";
let configured = false;

function configure() {
  if (configured) return;
  configured = true;
  // Con la app abierta también se muestran como aviso
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    // Android 13+ necesita el canal creado antes de pedir permiso
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Alertas",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#0b6623",
    }).catch(() => {});
  }
}

const toState = (p: Notifications.NotificationPermissionsStatus): PermissionState => {
  if (p.granted) return "granted";
  if (p.status === "undetermined" || p.canAskAgain) return "default";
  return "denied";
};

export async function getPermission(): Promise<PermissionState> {
  configure();
  try {
    return toState(await Notifications.getPermissionsAsync());
  } catch {
    return "unsupported";
  }
}

export async function requestPermission(): Promise<PermissionState> {
  configure();
  try {
    return toState(await Notifications.requestPermissionsAsync());
  } catch {
    return "unsupported";
  }
}

export async function showNotification(title: string, body: string, opts: NotifyOptions = {}): Promise<void> {
  configure();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url: opts.url } },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL } : null,
  });
}

/** Llama a `cb(url)` cuando la persona toca una notificación. Devuelve la función para dejar de escuchar. */
export function onNotificationOpen(cb: (url: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string" && url) cb(url);
  });
  return () => sub.remove();
}
