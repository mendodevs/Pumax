import { useI18n } from "../../i18n";
import { Users } from "lucide-react-native";
import ListScreen, { Badge, Primary, Secondary } from "../../components/ListScreen";
import EditClientModal from "../../components/modals/EditClientModal";
import NewClientModal from "../../components/modals/NewClientModal";
import { useClients } from "../../hooks/useClients";
import { deleteClient } from "../../services/clients.service";
import { Client } from "../../types/clients.types";

export default function ClientsScreen() {
  const { t } = useI18n();
  const { clients, loading, error, refetch } = useClients();
  const typeLabel = (c: Client) =>
    c.tipo_cliente === "MAYORISTA" ? t("lists.clients.wholesale") : t("lists.clients.retail");

  return (
    <ListScreen<Client>
      title={t("lists.clients.title")}
      subtitle={t("lists.clients.subtitle")}
      icon={Users}
      noun={t("lists.clients.noun")}
      plural={t("lists.clients.plural")}
      items={clients}
      loading={loading}
      error={error}
      onRetry={refetch}
      searchPlaceholder={t("lists.clients.search")}
      matches={(c, q) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.cuit ?? "").includes(q)
      }
      getName={(c) => c.nombre}
      columns={[
        { header: t("lists.clients.colClient"), flex: 1.4, render: (c) => <Primary>{c.nombre}</Primary> },
        { header: t("lists.col.cuit"), width: 130, render: (c) => <Secondary>{c.cuit}</Secondary> },
        { header: t("lists.col.phone"), flex: 1, render: (c) => <Secondary>{c.telefono}</Secondary> },
        { header: t("lists.col.email"), flex: 1.4, render: (c) => <Secondary>{c.email}</Secondary> },
        {
          header: t("lists.col.type"),
          width: 110,
          render: (c) => (
            <Badge
              text={typeLabel(c)}
              tone={c.tipo_cliente === "MAYORISTA" ? "wine" : "brand"}
            />
          ),
        },
      ]}
      cardLines={[
        { label: t("lists.col.legalName"), value: (c) => c.razon_social },
        { label: t("lists.col.cuit"), value: (c) => c.cuit },
        { label: t("lists.col.phone"), value: (c) => c.telefono },
        { label: t("lists.col.email"), value: (c) => c.email },
        { label: t("lists.col.type"), value: typeLabel },
      ]}
      onDelete={deleteClient}
      renderNewModal={(p) => <NewClientModal {...p} />}
      renderEditModal={({ item, ...p }) => <EditClientModal client={item} {...p} />}
    />
  );
}
