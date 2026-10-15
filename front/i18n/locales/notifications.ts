import type { LocaleModule } from "../core";

/** Textos de las notificaciones que dispara la app */
const notifications: LocaleModule = {
  es: {
    "notif.orders.title.one": "Nuevo pedido pendiente",
    "notif.orders.title.other": "{n} pedidos nuevos",
    "notif.orders.body.one": "Hay 1 pedido pendiente de atender.",
    "notif.orders.body.other": "Hay {n} pedidos pendientes de atender.",
    "notif.stock.title": "Stock bajo",
    "notif.stock.body.one": "1 producto está en el mínimo o por debajo.",
    "notif.stock.body.other": "{n} productos están en el mínimo o por debajo.",
    "notif.stock.empty.one": "Hay 1 agotado.",
    "notif.stock.empty.other": "Hay {n} agotados.",
    "notif.test.title": "Pumax",
    "notif.test.body": "Las notificaciones están funcionando.",
  },
  en: {
    "notif.orders.title.one": "New pending order",
    "notif.orders.title.other": "{n} new orders",
    "notif.orders.body.one": "There is 1 order waiting to be handled.",
    "notif.orders.body.other": "There are {n} orders waiting to be handled.",
    "notif.stock.title": "Low stock",
    "notif.stock.body.one": "1 product is at or below its minimum.",
    "notif.stock.body.other": "{n} products are at or below their minimum.",
    "notif.stock.empty.one": "1 is out of stock.",
    "notif.stock.empty.other": "{n} are out of stock.",
    "notif.test.title": "Pumax",
    "notif.test.body": "Notifications are working.",
  },
};

export default notifications;
