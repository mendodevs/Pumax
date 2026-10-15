import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { Plus, Search, TrendingUp, TrendingDown, AlertCircle } from "lucide-react-native";
import SpecialStockModal from "../modals/NewSpecialStockModal";
import { useMovimientos } from "../../hooks/useMovimientos";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

export default function AdjustmentsPanel() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const [SpecialStockModalOpen, setSpecialStockModalOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [search, setSearch] = useState("");

  const { movimientos, loading, error, refetch } = useMovimientos();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale);
  };

  // Filtrar movimientos localmente
  const filteredMovimientos = (movimientos || []).filter((mov) => {
    const matchesSearch =
      mov.producto_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      mov.motivo?.toLowerCase().includes(search.toLowerCase()) ||
      mov.id.toString().includes(search);

    const matchesTipo = !filterTipo || mov.tipo_movimiento === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return <TrendingUp color="#10B981" size={20} />;
      case 'SALIDA':
        return <TrendingDown color="#EF4444" size={20} />;
      case 'AJUSTE':
        return <AlertCircle color="#F59E0B" size={20} />;
      default:
        return null;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return 'bg-brand-500';
      case 'SALIDA':
        return 'bg-red-600';
      case 'AJUSTE':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const tipoLabel = (tipo: string) => {
    const key = `stock.movType.${tipo}`;
    const label = t(key);
    return label === key ? tipo : label;
  };

  const handleModalClose = () => {
    setSpecialStockModalOpen(false);
    // Refrescar la lista después de crear un movimiento
    refetch();
  };

  if (loading && movimientos.length === 0) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#45bd66" />
        <Text className="text-ink mt-4">{t("stock.adj.loading")}</Text>
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
        <Text className="text-gray-400">{t("stock.adj.subtitle")}</Text>
      </View>

      {/* Búsqueda */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
          <Search color={theme.muted} size={20} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("stock.adj.searchPlaceholder")}
            placeholderTextColor={theme.placeholder}
            className="flex-1 ml-2 text-ink"
          />
        </View>
      </View>

      {/* Filtros por tipo */}
      <View className="px-4 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <TouchableOpacity
            onPress={() => setFilterTipo("")}
            className={`px-4 py-2 rounded-full mr-2 ${filterTipo === "" ? "bg-brand-700" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.all")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterTipo("ENTRADA")}
            className={`px-4 py-2 rounded-full mr-2 ${filterTipo === "ENTRADA" ? "bg-brand-500" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.move.in")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterTipo("SALIDA")}
            className={`px-4 py-2 rounded-full mr-2 ${filterTipo === "SALIDA" ? "bg-red-600" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.move.out")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterTipo("AJUSTE")}
            className={`px-4 py-2 rounded-full ${filterTipo === "AJUSTE" ? "bg-yellow-600" : "bg-slate-800"}`}
          >
            <Text className="text-white">{t("stock.move.adjust")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de movimientos */}
      <ScrollView className="flex-1 px-4">
        {filteredMovimientos.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400 text-lg">{t("stock.adj.notFound")}</Text>
          </View>
        ) : (
          filteredMovimientos.map((movimiento) => (
            <View key={movimiento.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    {getTipoIcon(movimiento.tipo_movimiento)}
                    <Text className="text-ink font-bold text-lg ml-2">
                      {movimiento.producto_nombre}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {t("stock.adj.idLine", { id: movimiento.id, date: formatDate(movimiento.fecha) })}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${getTipoColor(movimiento.tipo_movimiento)}`}>
                  <Text className="text-ink text-xs font-semibold">
                    {tipoLabel(movimiento.tipo_movimiento)}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-300">{t("stock.adj.quantity")}</Text>
                <Text className={`font-bold text-lg ${
                  movimiento.tipo_movimiento === 'ENTRADA' ? 'text-brand-400' :
                  movimiento.tipo_movimiento === 'SALIDA' ? 'text-red-500' :
                  'text-yellow-500'
                }`}>
                  {movimiento.tipo_movimiento === 'ENTRADA' ? '+' :
                   movimiento.tipo_movimiento === 'SALIDA' ? '-' : '±'}
                  {movimiento.cantidad}
                </Text>
              </View>

              <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-slate-700">
                <Text className="text-gray-300">{t("stock.adj.prevStock")}</Text>
                <Text className="text-ink font-semibold">{movimiento.stock_anterior}</Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-300">{t("stock.adj.newStock")}</Text>
                <Text className="text-ink font-bold text-lg">{movimiento.stock_nuevo}</Text>
              </View>

              {movimiento.motivo && (
                <View className="bg-slate-700 rounded-lg p-2">
                  <Text className="text-gray-400 text-xs mb-1">{t("stock.adj.reason")}</Text>
                  <Text className="text-ink text-sm">{movimiento.motivo}</Text>
                </View>
              )}

              {movimiento.usuario && (
                <View className="mt-2">
                  <Text className="text-gray-500 text-xs">
                    {t("stock.adj.recordedBy", { user: movimiento.usuario })}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer con totales */}
      <View className="bg-slate-800 px-4 py-3 border-t border-slate-700">
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-300">{t("stock.adj.totalMovements")}</Text>
          <Text className="text-ink font-bold text-lg">{filteredMovimientos.length}</Text>
        </View>
      </View>

      {/* Botón flotante */}
      <TouchableOpacity
        className="bg-brand-500 rounded-full w-14 h-14 absolute bottom-20 right-6 justify-center items-center shadow-lg shadow-black/40"
        onPress={() => setSpecialStockModalOpen(true)}
      >
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      {/* Modal */}
      {SpecialStockModalOpen && (
        <SpecialStockModal
          visible={SpecialStockModalOpen}
          onClose={handleModalClose}
        />
      )}
    </View>
  );
}
