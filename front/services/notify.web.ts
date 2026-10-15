/**
 * Notificaciones en la web / PWA con la API Notification.
 * Si el service worker está activo se usa registration.showNotification (necesario en Chrome para Android
 * y para que funcione al tocar la notificación con la PWA cerrada); si no, new Notification.
 */
import type { NotifyOptions, PermissionState } from "./notify.types";

export type { NotifyOptions, PermissionState } from "./notify.types";

const supported = () => typeof window !== "undefined" && "Notification" in window;

export async function getPermission(): Promise<PermissionState> {
  if (!supported()) return "unsupported";
  return Notification.permission as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (!supported()) return "unsupported";
  try {
    // Safari viejo usa callback en vez de promesa
    const result: NotificationPermission = await new Promise((resolve) => {
      const maybe = Notification.requestPermission(resolve);
      if (maybe && typeof (maybe as Promise<NotificationPermission>).then === "function") {
        (maybe as Promise<NotificationPermission>).then(resolve);
      }
    });
    return result as PermissionState;
  } catch {
    return "unsupported";
  }
}

export async function showNotification(title: string, body: string, opts: NotifyOptions = {}): Promise<void> {
  if (!supported() || Notification.permission !== "granted") return;
  const options: NotificationOptions & { data?: unknown } = {
    body,
    tag: opts.tag,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: opts.url },
  };
  try {
    const reg = await (navigator as any).serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    // seguimos con el respaldo
  }
  const n = new Notification(title, options);
  n.onclick = () => {
    window.focus();
    if (opts.url) window.location.assign(opts.url);
    n.close();
  };
}

/** En la web el toque lo resuelve el service worker (sw.js), acá no hay nada que escuchar */
export function onNotificationOpen(_cb: (url: string) => void): () => void {
  return () => {};
}
