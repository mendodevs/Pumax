import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useState } from "react";
import { useIngresos } from "../../hooks/useIngresos";
import {
  verificarIngreso,
  completarIngreso,
  createIngreso,
} from "../../services/buys.service";
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Plus,
  X,
} from "lucide-react-native";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

export default function PurchasesPanel() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    proveedor_id: "",
    observaciones: "",
  });

  const { ingresos, loading, error, refetch } = useIngresos();

  const handleCreateIngreso = async () => {
    if (!formData.proveedor_id) {
      alert(t("stock.purchases.enterSupplier"));
      return;
    }

    try {
      setCreateLoading(true);
      const today = new Date().toISOString().split("T")[0];

      await createIngreso({
        proveedor_id: parseInt(formData.proveedor_id),
        fecha_ingreso: today,
        observaciones: formData.observaciones,
        items: [], // En producción esto vendría de un formulario de items
      });

      alert(t("stock.purchases.created"));
      setModalVisible(false);
      setFormData({ proveedor_id: "", observaciones: "" });
      await refetch();
    } catch (err: any) {
      alert(t("stock.purchases.createError", { message: err.message }));
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtrar ingresos localmente
  const filteredIngresos = ingresos.filter((ingreso) => {
    const matchesSearch =
      ingreso.proveedor?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      ingreso.id.toString().includes(search) ||
      ingreso.numero_comprobante?.includes(search);

    const matchesStatus = !filterStatus || ingreso.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETADO":
        return "bg-brand-500";
      case "VERIFICADO":
        return "bg-brand-500";
      case "PENDIENTE":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const statusLabel = (estado: string) => {
    const key = `stock.status.${estado}`;
    const label = t(key);
    return label === key ? estado : label;
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleVerificar = async (id: number) => {
    try {
      setActionLoading(id);
      await verificarIngreso(id);
      await refetch();
      alert(t("stock.purchases.verified"));
    } catch (err: any) {
      alert(t("stock.errorPrefix", { error: err.message || t("stock.purchases.verifyFail") }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletar = async (id: number) => {
    try {
      setActionLoading(id);
      await completarIngreso(id);
      await refetch();
      alert(t("stock.purchases.completed"));
    } catch (err: any) {
      alert(t("stock.errorPrefix", { error: err.message || t("stock.purchases.completeFail") }));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && ingresos.length === 0) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#45bd66" />
        <Text className="text-ink mt-4">{t("stock.purchases.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center p-4">
        <Text className="text-red-500 text-lg mb-4">{t("stock.errorPrefix", { error })}</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-brand-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="px-4 pt-2 pb-4">

        {/* Barra de búsqueda */}
        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mb-3">
          <Search color={theme.muted} size={20} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("stock.purchases.searchPlaceholder")}
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 text-ink"
          />
        </View>

        {/* Filtros de estado */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          <TouchableOpacity
            onPress={() => setFilterStatus("")}
            className={`px-4 py-2 rounded-full mr-2 ${filterStatus === "" ? "bg-brand-700" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.all")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus("PENDIENTE")}
            className={`px-4 py-2 rounded-full mr-2 ${filterStatus === "PENDIENTE" ? "bg-yellow-600" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.filter.pending")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus("VERIFICADO")}
            className={`px-4 py-2 rounded-full mr-2 ${filterStatus === "VERIFICADO" ? "bg-wine-600" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.filter.verified")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus("COMPLETADO")}
            className={`px-4 py-2 rounded-full mr-2 ${filterStatus === "COMPLETADO" ? "bg-brand-500" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.filter.completed")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de ingresos */}
      <ScrollView className="flex-1 px-4">
        {filteredIngresos.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400 text-lg">
              {t("stock.purchases.notFound")}
            </Text>
          </View>
        ) : (
          filteredIngresos.map((ingreso) => (
            <View
              key={ingreso.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl mb-3 overflow-hidden"
            >
              <TouchableOpacity
                onPress={() => toggleExpand(ingreso.id)}
                className="p-4"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-ink font-bold text-lg mb-1">
                      {t("stock.purchases.receiptNum", { id: ingreso.id })}
                    </Text>
                    <Text className="text-gray-300">
                      {ingreso.proveedor?.nombre ||
                        t("stock.purchases.supplierNum", { id: ingreso.proveedor_id })}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {formatDate(ingreso.fecha_ingreso)}
                    </Text>
                    {ingreso.numero_comprobante && (
                      <Text className="text-gray-400 text-sm">
                        {ingreso.tipo_comprobante} {ingreso.numero_comprobante}
                      </Text>
                    )}
                  </View>
                  <View className="items-end">
                    <Text className="text-ink font-bold text-lg">
                      {formatCurrency(ingreso.total)}
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full ${getStatusColor(ingreso.estado)} mt-1`}
                    >
                      <Text className="text-ink text-xs font-semibold">
                        {statusLabel(ingreso.estado)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-gray-400 text-sm">
                    {expandedId === ingreso.id ? t("stock.viewLess") : t("stock.viewMore")}
                  </Text>
                  {expandedId === ingreso.id ? (
                    <ChevronUp color={theme.muted} size={20} />
                  ) : (
                    <ChevronDown color={theme.muted} size={20} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Detalles expandidos */}
              {expandedId === ingreso.id && (
                <View className="px-4 pb-4 border-t border-slate-700 pt-3">
                  {ingreso.observaciones && (
                    <View className="mb-3">
                      <Text className="text-gray-400 mb-1">{t("stock.notes")}</Text>
                      <Text className="text-ink">
                        {ingreso.observaciones}
                      </Text>
                    </View>
                  )}

                  {ingreso.items && ingreso.items.length > 0 && (
                    <View className="mb-3">
                      <Text className="text-gray-400 mb-2">{t("stock.products")}</Text>
                      {ingreso.items.map((item) => (
                        <View
                          key={item.id}
                          className="flex-row justify-between mb-2 bg-slate-700 p-2 rounded"
                        >
                          <View className="flex-1">
                            <Text className="text-ink">
                              {item.producto?.nombre ||
                                t("stock.productNum", { id: item.producto_id })}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                              {formatCurrency(item.precio_unitario)} x{" "}
                              {item.cantidad}
                            </Text>
                          </View>
                          <Text className="text-ink font-semibold">
                            {formatCurrency(item.subtotal)}
                          </Text>
                        </View>
                      ))}
                      <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-600">
                        <Text className="text-ink font-bold">{t("stock.total")}</Text>
                        <Text className="text-ink font-bold">
                          {formatCurrency(ingreso.total)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Botones de acción */}
                  <View className="flex-row gap-2 mt-3">
                    {ingreso.estado === "PENDIENTE" && (
                      <TouchableOpacity
                        onPress={() => handleVerificar(ingreso.id)}
                        disabled={actionLoading === ingreso.id}
                        className="flex-1 bg-brand-500 py-3 rounded-lg flex-row items-center justify-center"
                      >
                        {actionLoading === ingreso.id ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Clock color="white" size={18} />
                            <Text className="text-white font-semibold ml-2">
                              {t("stock.purchases.verify")}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {ingreso.estado === "VERIFICADO" && (
                      <TouchableOpacity
                        onPress={() => handleCompletar(ingreso.id)}
                        disabled={actionLoading === ingreso.id}
                        className="flex-1 bg-brand-500 py-3 rounded-lg flex-row items-center justify-center"
                      >
                        {actionLoading === ingreso.id ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <CheckCircle color="white" size={18} />
                            <Text className="text-white font-semibold ml-2">
                              {t("stock.purchases.complete")}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {ingreso.estado === "COMPLETADO" && (
                      <View className="flex-1 bg-gray-700 py-3 rounded-lg items-center">
                        <Text className="text-gray-400">
                          {t("stock.purchases.receiptCompleted")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer con totales */}
      <View className="bg-slate-800 px-4 py-3 border-t border-slate-700">
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-300">{t("stock.purchases.totalReceipts")}</Text>
          <Text className="text-ink font-bold text-lg">
            {filteredIngresos.length}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-gray-300">{t("stock.totalAmount")}</Text>
          <Text className="text-brand-400 font-bold text-lg">
            {formatCurrency(
              filteredIngresos.reduce((sum, ingreso) => sum + ingreso.total, 0)
            )}
          </Text>
        </View>
      </View>

      {/* Botón flotante para crear ingreso */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-20 right-6 bg-brand-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Modal para crear ingreso */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-ink text-xl font-bold">
                {t("stock.purchases.modal.title")}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.muted} size={24} />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-300 mb-2">{t("stock.purchases.modal.supplierId")}</Text>
              <TextInput
                value={formData.proveedor_id}
                onChangeText={(text) =>
                  setFormData({ ...formData, proveedor_id: text })
                }
                placeholder={t("stock.purchases.modal.supplierIdPlaceholder")}
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                className="bg-slate-700 rounded-lg px-4 py-3 text-ink"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-300 mb-2">{t("stock.purchases.modal.notes")}</Text>
              <TextInput
                value={formData.observaciones}
                onChangeText={(text) =>
                  setFormData({ ...formData, observaciones: text })
                }
                placeholder={t("stock.purchases.modal.notesPlaceholder")}
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={3}
                className="bg-slate-700 rounded-lg px-4 py-3 text-ink"
              />
            </View>

            <Text className="text-gray-400 text-sm mb-4">
              {t("stock.purchases.modal.demoNote")}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 bg-slate-700 py-3 rounded-lg"
              >
                <Text className="text-ink text-center font-semibold">
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateIngreso}
                disabled={createLoading}
                className="flex-1 bg-brand-500 py-3 rounded-lg"
              >
                {createLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    {t("stock.purchases.modal.create")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
