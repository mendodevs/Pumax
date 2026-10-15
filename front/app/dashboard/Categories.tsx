import { useI18n } from "../../i18n";
import { Blocks } from "lucide-react-native";
import ListScreen, { Primary, Secondary } from "../../components/ListScreen";
import EditCategoryModal from "../../components/modals/EditCategoryModal";
import NewCategoryModal from "../../components/modals/NewCategoryModal";
import { useCategories } from "../../hooks/useCategories";
import { deleteCategory } from "../../services/categories.service";
import { Category } from "../../types/categories.types";

export default function CategoriesScreen() {
  const { t } = useI18n();
  const { categories, loading, error, refetch } = useCategories();

  return (
    <ListScreen<Category>
      title={t("lists.categories.title")}
      subtitle={t("lists.categories.subtitle")}
      icon={Blocks}
      noun={t("lists.categories.noun")}
      plural={t("lists.categories.plural")}
      feminine
      items={categories}
      loading={loading}
      error={error}
      onRetry={refetch}
      searchPlaceholder={t("lists.categories.search")}
      matches={(c, q) =>
        c.nombre.toLowerCase().includes(q) || (c.descripcion ?? "").toLowerCase().includes(q)
      }
      getName={(c) => c.nombre}
      columns={[
        { header: t("lists.categories.colCategory"), flex: 1, render: (c) => <Primary>{c.nombre}</Primary> },
        { header: t("lists.col.description"), flex: 2, render: (c) => <Secondary>{c.descripcion}</Secondary> },
      ]}
      cardLines={[{ label: t("lists.col.description"), value: (c) => c.descripcion }]}
      onDelete={deleteCategory}
      renderNewModal={(p) => <NewCategoryModal {...p} />}
      renderEditModal={({ item, ...p }) => <EditCategoryModal category={item} {...p} />}
    />
  );
}
