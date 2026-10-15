import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  AlertTriangle,
  Edit,
  Lamp,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { useProducts } from "../../hooks/useProducts";
import { useNotice } from "../../hooks/useNotice";
import { deleteProduct } from "../../services/products.service";
import EditProductModal from "../../components/modals/EditProductModal";
import NewProductModal from "../../components/modals/NewProductModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import NoticeBanner from "../../components/NoticeBanner";
import { Product } from "../../types/products.types";
import { colors } from "../../constants/theme";
import { money } from "../../utils/format";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

const DEFAULT_MIN_STOCK = 5;

type StockLevel = "ok" | "low" | "out";

const stockLevel = (p: Product): StockLevel => {
  if (p.stock <= 0) return "out";
  return p.stock <= (p.stock_minimo || DEFAULT_MIN_STOCK) ? "low" : "ok";
};

const STOCK_STYLES: Record<StockLevel, { box: string; text: string }> = {
  ok: { box: "bg-brand-500/20", text: "text-brand-400" },
  low: { box: "bg-amber-500/20", text: "text-amber-400" },
  out: { box: "bg-red-500/20", text: "text-red-400" },
};

function StockBadge({ product }: { product: Product }) {
  const { t } = useI18n();
  const level = stockLevel(product);
  const s = STOCK_STYLES[level];
  return (
    <View className={`${s.box} rounded-full px-3 py-1 self-start`}>
      <Text className={`${s.text} text-xs font-bold`}>
        {level === "out" ? t("lists.products.outOfStock") : t("lists.products.units", { n: product.stock })}
      </Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <View className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
      <Text className="text-slate-400 text-xs">{label}</Text>
      <Text className={`${tone} text-2xl font-bold mt-1`}>{value}</Text>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 mr-2 rounded-full border ${
        active ? "bg-brand-500 border-brand-400" : "bg-slate-800 border-slate-600"
      }`}
    >
      <Text className={`text-sm ${active ? "text-white font-semibold" : "text-slate-300"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ActionButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row">
      <TouchableOpacity onPress={onEdit} className="p-2 rounded-lg bg-slate-700 mr-2">
        <Edit color={colors.brandLight} size={16} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} className="p-2 rounded-lg bg-red-600/20">
        <Trash2 color={colors.danger} size={16} />
      </TouchableOpacity>
    </View>
  );
}

export default function ProductsScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { products, loading, error, refetch } = useProducts();
  const { notice, showNotice } = useNotice();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [newVisible, setNewVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.categoria?.nombre).filter(Boolean) as string[])
      ).sort(),
    [products]
  );

  const stats = useMemo(
    () => ({
      total: products.length,
      low: products.filter((p) => stockLevel(p) === "low").length,
      out: products.filter((p) => stockLevel(p) === "out").length,
    }),
    [products]
  );

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.descripcion.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.categoria?.nombre ?? "").toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || p.categoria?.nombre === categoryFilter;
    const matchesStock = !onlyLowStock || stockLevel(p) !== "ok";
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditVisible(true);
  };

  const handleEditClose = () => {
    setEditVisible(false);
    setSelectedProduct(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      showNotice("success", t("lists.products.deleted", { name: productToDelete.descripcion }));
      refetch();
    } catch (err) {
      showNotice("error", t("lists.products.deleteFailed"));
    } finally {
      setDeleting(false);
      setProductToDelete(null);
    }
  };

  // ---------- Filas ----------
  const renderDesktopRow = ({ item }: { item: Product }) => (
    <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-2">
      <Text className="text-slate-400 text-xs w-24" numberOfLines={1}>
        {item.codigo}
      </Text>
      <Text className="text-ink font-semibold flex-1 pr-2" numberOfLines={1}>
        {item.descripcion}
      </Text>
      <Text className="text-slate-300 flex-1 pr-2" numberOfLines={1}>
        {item.categoria?.nombre || t("lists.products.noCategory")}
      </Text>
      <View className="w-24">
        <StockBadge product={item} />
      </View>
      <Text className="text-brand-400 font-bold w-28 text-right">
        ${money(Number(item.precio_venta))}
      </Text>
      <View className="w-24 items-end">
        <ActionButtons onEdit={() => handleEdit(item)} onDelete={() => setProductToDelete(item)} />
      </View>
    </View>
  );

  const renderMobileCard = ({ item }: { item: Product }) => (
    <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-ink font-semibold text-base">{item.descripcion}</Text>
          <Text className="text-slate-400 text-xs mt-1">
            {item.codigo} · {item.categoria?.nombre || t("lists.products.noCategory")}
          </Text>
        </View>
        <StockBadge product={item} />
      </View>
      <View className="flex-row items-center justify-between mt-4">
        <Text className="text-brand-400 font-bold text-lg">
          ${money(Number(item.precio_venta))}
        </Text>
        <ActionButtons onEdit={() => handleEdit(item)} onDelete={() => setProductToDelete(item)} />
      </View>
    </View>
  );

  // ---------- Estados ----------
  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brandLight} />
        <Text className="text-ink mt-4">{t("lists.products.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-4">
        <AlertTriangle color={colors.danger} size={48} />
        <Text className="text-ink text-lg mt-4 text-center">{error}</Text>
        <TouchableOpacity
          onPress={refetch}
          className="bg-brand-500 px-6 py-3 rounded-xl mt-4"
        >
          <Text className="text-white font-semibold">{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Encabezado de la lista ----------
  const listHeader = (
    <View>
      {/* Título + acción principal */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
            <Lamp color={colors.wineLight} size={22} />
          </View>
          <View>
            <Text className="text-2xl font-bold text-ink">{t("lists.products.title")}</Text>
            <Text className="text-slate-400 text-sm">{t("lists.products.subtitle")}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setNewVisible(true)}
          className="flex-row items-center bg-brand-500 active:bg-brand-700 rounded-xl px-4 py-3"
        >
          <Plus color="#fff" size={18} />
          <Text className="text-white font-bold ml-1">{isMobile ? t("lists.products.newShort") : t("lists.products.new")}</Text>
        </TouchableOpacity>
      </View>

      <NoticeBanner notice={notice} />

      {/* Resumen */}
      <View className="flex-row mb-4" style={{ gap: 12 }}>
        <StatCard label={t("lists.products.statProducts")} value={stats.total} />
        <StatCard label={t("lists.products.statLow")} value={stats.low} tone="text-amber-400" />
        <StatCard label={t("lists.products.statOut")} value={stats.out} tone="text-red-400" />
      </View>

      {/* Búsqueda */}
      <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mb-3">
        <Search color={colors.muted} size={20} />
        <TextInput
          placeholder={t("lists.products.search")}
          placeholderTextColor={theme.placeholder}
          value={search}
          onChangeText={setSearch}
          className="flex-1 ml-2 text-ink py-1"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <X color={colors.muted} size={20} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros rápidos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <Chip
          label={t("lists.products.chipAll")}
          active={!categoryFilter}
          onPress={() => setCategoryFilter(null)}
        />
        {categories.map((c) => (
          <Chip
            key={c}
            label={c}
            active={categoryFilter === c}
            onPress={() => setCategoryFilter(categoryFilter === c ? null : c)}
          />
        ))}
        <Chip
          label={t("lists.products.chipLow")}
          active={onlyLowStock}
          onPress={() => setOnlyLowStock(!onlyLowStock)}
        />
      </ScrollView>

      {/* Cabecera de tabla (solo escritorio) */}
      {!isMobile && (
        <View className="flex-row items-center px-4 pb-2">
          <Text className="text-slate-400 text-xs font-semibold uppercase w-24">{t("lists.products.colCode")}</Text>
          <Text className="text-slate-400 text-xs font-semibold uppercase flex-1">{t("lists.products.colProduct")}</Text>
          <Text className="text-slate-400 text-xs font-semibold uppercase flex-1">{t("lists.products.colCategory")}</Text>
          <Text className="text-slate-400 text-xs font-semibold uppercase w-24">{t("lists.products.colStock")}</Text>
          <Text className="text-slate-400 text-xs font-semibold uppercase w-28 text-right">
            {t("lists.products.colPrice")}
          </Text>
          <Text className="text-slate-400 text-xs font-semibold uppercase w-24 text-right">
            {t("lists.actions")}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={isMobile ? renderMobileCard : renderDesktopRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Lamp color={colors.muted} size={32} />
            <Text className="text-slate-400 mt-3">{t("lists.products.empty")}</Text>
          </View>
        }
        contentContainerStyle={{
          width: "100%",
          maxWidth: 1100,
          alignSelf: "center",
          paddingHorizontal: 16,
          paddingTop: isMobile ? 72 : 24,
          paddingBottom: 32,
        }}
      />

      {/* Alta de producto */}
      <NewProductModal
        visible={newVisible}
        onClose={() => setNewVisible(false)}
        onSuccess={() => {
          refetch();
          showNotice("success", t("lists.products.created"));
        }}
      />

      {/* Edición */}
      <EditProductModal
        visible={editVisible}
        product={selectedProduct}
        onClose={handleEditClose}
        onSuccess={() => {
          refetch();
          showNotice("success", t("lists.products.updated"));
        }}
      />

      {/* Confirmación de borrado */}
      <ConfirmDialog
        visible={!!productToDelete}
        title={t("lists.products.deleteTitle")}
        message={t("lists.products.deleteConfirm", { name: productToDelete?.descripcion ?? "" })}
        confirmText={t("common.delete")}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </View>
  );
}
