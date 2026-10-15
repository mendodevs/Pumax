import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { X, Search } from 'lucide-react-native';
import { useI18n } from '../../i18n';
import { useTheme } from "../../context/SettingsContext";

interface Client {
  id: number;
  name: string;
  cuit?: string;
  razon_social?: string;
}

interface SelectClientModalProps {
  visible: boolean;
  clients: Client[];
  onClose: () => void;
  onSelect: (clientId: number) => void;
  selectedClientId?: string;
}

export default function SelectClientModal({
  visible,
  clients,
  onClose,
  onSelect,
  selectedClientId
}: SelectClientModalProps) {
  const { t } = useI18n();
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');

  // Filtrar clientes por nombre, CUIT o razón social
  const filteredClients = clients.filter(client => {
    const searchLower = searchText.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.cuit?.toLowerCase().includes(searchLower) ||
      client.razon_social?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (clientId: number) => {
    onSelect(clientId);
    setSearchText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-slate-900 rounded-lg p-6 w-11/12 max-w-md" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-ink text-xl font-bold">{t("billing.clientModal.title")}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View className="bg-slate-800 rounded-lg px-4 py-3 mb-4 flex-row items-center border border-gray-600">
            <Search color={theme.muted} size={20} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t("billing.clientModal.searchPlaceholder")}
              placeholderTextColor={theme.placeholder}
              className="flex-1 ml-2 text-ink"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <X color={theme.muted} size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de clientes - SCROLLABLE */}
          <View style={{ flex: 1 }}>
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.id)}
                  className={`p-4 mb-2 rounded-lg border ${
                    selectedClientId === item.id.toString()
                      ? 'bg-brand-500 border-brand-500'
                      : 'bg-slate-800 border-gray-600'
                  }`}
                >
                  <Text className="text-white font-semibold text-base">{item.name}</Text>
                  {item.razon_social && (
                    <Text className="text-slate-300 text-sm mt-1">{item.razon_social}</Text>
                  )}
                  {item.cuit && (
                    <Text className="text-slate-400 text-sm mt-1">{t("billing.clientModal.cuit", { cuit: item.cuit })}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-8">
                  <Text className="text-slate-400 text-base">
                    {searchText ? t("billing.clientModal.noMatch") : t("billing.clientModal.none")}
                  </Text>
                </View>
              }
            />
          </View>

          {/* Footer */}
          <View className="mt-4">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-600 px-4 py-3 rounded-lg"
            >
              <Text className="text-ink text-center font-semibold">{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
