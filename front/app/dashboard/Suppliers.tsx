import { useI18n } from "../../i18n";
import { Package } from "lucide-react-native";
import ListScreen, { Primary, Secondary } from "../../components/ListScreen";
import EditSupplierModal from "../../components/modals/EditSupplierModal";
import NewSupplierModal from "../../components/modals/NewSupplierModal";
import { useSuppliers } from "../../hooks/useSuppliers";
import { deleteSupplier } from "../../services/suppliers.service";
import { Supplier } from "../../types/suppliers.types";

export default function SuppliersScreen() {
  const { t } = useI18n();
  const { suppliers, loading, error, refetch } = useSuppliers();

  return (
    <ListScreen<Supplier>
      title={t("lists.suppliers.title")}
      subtitle={t("lists.suppliers.subtitle")}
      icon={Package}
      noun={t("lists.suppliers.noun")}
      plural={t("lists.suppliers.plural")}
      items={suppliers}
      loading={loading}
      error={error}
      onRetry={refetch}
      searchPlaceholder={t("lists.suppliers.search")}
      matches={(s, q) =>
        s.nombre.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q)
      }
      getName={(s) => s.nombre}
      columns={[
        { header: t("lists.suppliers.colSupplier"), flex: 1.3, render: (s) => <Primary>{s.nombre}</Primary> },
        { header: t("lists.col.phone"), flex: 1, render: (s) => <Secondary>{s.telefono}</Secondary> },
        { header: t("lists.col.address"), flex: 1.4, render: (s) => <Secondary>{s.direccion}</Secondary> },
        { header: t("lists.col.email"), flex: 1.4, render: (s) => <Secondary>{s.email}</Secondary> },
      ]}
      cardLines={[
        { label: t("lists.col.phone"), value: (s) => s.telefono },
        { label: t("lists.col.address"), value: (s) => s.direccion },
        { label: t("lists.col.email"), value: (s) => s.email },
      ]}
      onDelete={deleteSupplier}
      renderNewModal={(p) => <NewSupplierModal {...p} />}
      renderEditModal={({ item, ...p }) => <EditSupplierModal supplier={item} {...p} />}
    />
  );
}
