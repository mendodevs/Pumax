import { useState, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  AlertTriangle,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react-native";
import ConfirmDialog from "./ConfirmDialog";
import NoticeBanner from "./NoticeBanner";
import { useNotice } from "../hooks/useNotice";
import { colors } from "../constants/theme";
import { useI18n } from "../i18n";
import { useTheme } from "../context/SettingsContext";

/* ---------- Piezas para armar celdas ---------- */

/** Texto principal de una celda (nombre, etc.) */
export const Primary = ({ children }: { children: ReactNode }) => (
  <Text className="text-ink font-semibold" numberOfLines={1}>
    {children}
  </Text>
);

/** Texto secundario; si no hay dato muestra un guion */
export const Secondary = ({ children }: { children?: string | null }) => (
  <Text className={children ? "text-slate-300" : "text-slate-500"} numberOfLines={1}>
    {children || "—"}
  </Text>
);

/** Etiqueta chica de color */
export const Badge = ({ text, tone = "brand" }: { text: string; tone?: "brand" | "wine" | "amber" }) => {
  const styles = {
    brand: "bg-brand-500/20 text-brand-400",
    wine: "bg-wine-600/20 text-wine-400",
    amber: "bg-amber-500/20 text-amber-400",
  }[tone].split(" ");
  return (
    <View className={`${styles[0]} rounded-full px-3 py-1 self-start`}>
      <Text className={`${styles[1]} text-xs font-bold`}>{text}</Text>
    </View>
  );
};

/* ---------- Tipos ---------- */

export type Column<T> = {
  header: string;
  /** Ancho relativo (por defecto 1). Se ignora si hay `width` */
  flex?: number;
  /** Ancho fijo en píxeles */
  width?: number;
  render: (item: T) => ReactNode;
};

export type CardLine<T> = {
  label: string;
  value: (item: T) => string | null | undefined;
};

type ModalProps = { visible: boolean; onClose: () => void; onSuccess: () => void };

type Props<T extends { id: number }> = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Nombre en singular para los mensajes: "Cliente", "Categoría"... */
  noun: string;
  /** Plural en minúscula para el mensaje de lista vacía: "clientes", "proveedores"... */
  plural: string;
  /** true si el sustantivo es femenino (Categoría -> "creada") */
  feminine?: boolean;

  items: T[];
  loading: boolean;
  error?: string | null;
  onRetry: () => void;

  searchPlaceholder: string;
  matches: (item: T, query: string) => boolean;
  /** Texto que identifica al registro en confirmaciones y avisos */
  getName: (item: T) => string;

  columns: Column<T>[];
  /** Datos que se muestran en la tarjeta del celular, además del nombre */
  cardLines: CardLine<T>[];

  onDelete: (id: number) => Promise<unknown>;
  renderNewModal: (props: ModalProps) => ReactNode;
  renderEditModal: (props: ModalProps & { item: T | null }) => ReactNode;
};

/**
 * Pantalla de listado con alta, edición y baja.
 * Se usa en Clientes, Categorías y Proveedores para que se vean y funcionen igual.
 */
export default function ListScreen<T extends { id: number }>({
  title,
  subtitle,
  icon: Icon,
  noun,
  plural,
  feminine = false,
  items,
  loading,
  error,
  onRetry,
  searchPlaceholder,
  matches,
  getName,
  columns,
  cardLines,
  onDelete,
  renderNewModal,
  renderEditModal,
}: Props<T>) {
  const { t } = useI18n();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { notice, showNotice } = useNotice();

  const [search, setSearch] = useState("");
  const [newVisible, setNewVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const g = feminine ? "f" : "m";
  const lower = noun.toLowerCase();
  const filtered = items.filter((item) => matches(item, search.toLowerCase()));

  const openEdit = (item: T) => {
    setSelected(item);
    setEditVisible(true);
  };

  const closeEdit = () => {
    setEditVisible(false);
    setSelected(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await onDelete(toDelete.id);
      showNotice("success", t(`lists.deleted.${g}`, { noun, name: getName(toDelete) }));
      onRetry();
    } catch (err) {
      const reason = err instanceof Error && err.message ? `: ${err.message}` : "";
      showNotice("error", t(`lists.deleteFailed.${g}`, { noun: lower, reason }));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  /* ---------- Acciones y filas ---------- */

  const actions = (item: T) => (
    <View className="flex-row">
      <TouchableOpacity onPress={() => openEdit(item)} className="p-2 rounded-lg bg-slate-700 mr-2">
        <Edit color={colors.brandLight} size={16} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setToDelete(item)} className="p-2 rounded-lg bg-red-600/20">
        <Trash2 color={colors.danger} size={16} />
      </TouchableOpacity>
    </View>
  );

  const cellStyle = (c: Column<T>) =>
    c.width ? { width: c.width } : { flex: c.flex ?? 1 };

  const renderDesktopRow = ({ item }: { item: T }) => (
    <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-2">
      {columns.map((c) => (
        <View key={c.header} style={cellStyle(c)} className="pr-3">
          {c.render(item)}
        </View>
      ))}
      <View className="w-24 items-end">{actions(item)}</View>
    </View>
  );

  const renderMobileCard = ({ item }: { item: T }) => {
    const lines = cardLines
      .map((l) => ({ label: l.label, value: l.value(item) }))
      .filter((l) => l.value);
    return (
      <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3">
        <View className="flex-row items-start justify-between">
          <Text className="text-ink font-semibold text-base flex-1 pr-3">{getName(item)}</Text>
          {actions(item)}
        </View>
        {lines.length > 0 && (
          <View className="mt-3">
            {lines.map((l) => (
              <View key={l.label} className="flex-row mb-1">
                <Text className="text-slate-400 text-sm w-24">{l.label}</Text>
                <Text className="text-slate-200 text-sm flex-1">{l.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  /* ---------- Estados ---------- */

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brandLight} />
        <Text className="text-ink mt-4">{t("lists.loading", { title: title.toLowerCase() })}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-4">
        <AlertTriangle color={colors.danger} size={48} />
        <Text className="text-ink text-lg mt-4 text-center">{error}</Text>
        <TouchableOpacity onPress={onRetry} className="bg-brand-500 px-6 py-3 rounded-xl mt-4">
          <Text className="text-white font-semibold">{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------- Pantalla ---------- */

  const header = (
    <View>
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center flex-1 pr-3">
          <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
            <Icon color={colors.wineLight} size={22} />
          </View>
          <View>
            <Text className="text-2xl font-bold text-ink">{title}</Text>
            <Text className="text-slate-400 text-sm">{subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setNewVisible(true)}
          className="flex-row items-center bg-brand-500 active:bg-brand-700 rounded-xl px-4 py-3"
        >
          <Plus color="#fff" size={18} />
          <Text className="text-white font-bold ml-1">
            {isMobile ? t(`lists.newShort.${g}`) : t(`lists.new.${g}`, { noun: lower })}
          </Text>
        </TouchableOpacity>
      </View>

      <NoticeBanner notice={notice} />

      <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mb-2">
        <Search color={colors.muted} size={20} />
        <TextInput
          placeholder={searchPlaceholder}
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
      <Text className="text-slate-400 text-xs mb-4 ml-1">
        {t("lists.count", { shown: filtered.length, total: items.length })}
      </Text>

      {!isMobile && (
        <View className="flex-row items-center px-4 pb-2">
          {columns.map((c) => (
            <Text
              key={c.header}
              style={cellStyle(c)}
              className="text-slate-400 text-xs font-semibold uppercase pr-3"
            >
              {c.header}
            </Text>
          ))}
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
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={isMobile ? renderMobileCard : renderDesktopRow}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Icon color={colors.muted} size={32} />
            <Text className="text-slate-400 mt-3">
              {search ? t("lists.noResults") : t(`lists.empty.${g}`, { plural })}
            </Text>
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

      {renderNewModal({
        visible: newVisible,
        onClose: () => setNewVisible(false),
        onSuccess: () => {
          onRetry();
          showNotice("success", t(`lists.created.${g}`, { noun }));
        },
      })}

      {renderEditModal({
        visible: editVisible,
        item: selected,
        onClose: closeEdit,
        onSuccess: () => {
          onRetry();
          showNotice("success", t(`lists.updated.${g}`, { noun }));
        },
      })}

      <ConfirmDialog
        visible={!!toDelete}
        title={t("lists.deleteTitle", { noun: lower })}
        message={t(`lists.deleteConfirm.${g}`, { noun: lower, name: toDelete ? getName(toDelete) : "" })}
        confirmText={t("common.delete")}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}
