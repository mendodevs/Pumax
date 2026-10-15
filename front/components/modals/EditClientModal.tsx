import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { Client, UpdateClientRequest } from '../../types/clients.types';
import { updateClient } from '../../services/clients.service';
import { useI18n } from '../../i18n';

interface EditClientModalProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditClientModal({ visible, client, onClose, onSuccess }: EditClientModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateClientRequest>({ nombre: '' });

  useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre,
        razon_social: client.razon_social || '',
        cuit: client.cuit || '',
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || '',
      });
    }
  }, [client]);

  const handleSave = async () => {
    if (!client || !formData.nombre?.trim()) {
      Alert.alert(t('forms.alert.error'), t('forms.edit.errName'));
      return;
    }

    setLoading(true);
    try {
      await updateClient(client.id, formData);
      Alert.alert(t('forms.alert.success'), t('forms.editClient.success'));
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert(t('forms.alert.error'), t('forms.editClient.failure'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-slate-900 rounded-lg w-11/12 max-h-5/6 p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-ink text-xl font-bold">{t('forms.editClient.title')}</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text className="text-slate-300 mb-1">{t('forms.edit.nameReq')}</Text>
            <TextInput value={formData.nombre} onChangeText={(v) => setFormData({ ...formData, nombre: v })} className="border border-gray-600 rounded-lg px-3 py-2 mb-3 text-ink bg-slate-800" editable={!loading} />

            <Text className="text-slate-300 mb-1">{t('forms.field.cuit')}</Text>
            <TextInput value={formData.cuit} onChangeText={(v) => setFormData({ ...formData, cuit: v })} className="border border-gray-600 rounded-lg px-3 py-2 mb-3 text-ink bg-slate-800" editable={!loading} />

            <Text className="text-slate-300 mb-1">{t('forms.field.phone')}</Text>
            <TextInput value={formData.telefono} onChangeText={(v) => setFormData({ ...formData, telefono: v })} className="border border-gray-600 rounded-lg px-3 py-2 mb-3 text-ink bg-slate-800" editable={!loading} />

            <Text className="text-slate-300 mb-1">{t('forms.field.email')}</Text>
            <TextInput value={formData.email} onChangeText={(v) => setFormData({ ...formData, email: v })} className="border border-gray-600 rounded-lg px-3 py-2 mb-4 text-ink bg-slate-800" editable={!loading} />
          </ScrollView>

          <View className="flex-row justify-end mt-4">
            <TouchableOpacity onPress={onClose} className="bg-gray-600 px-4 py-2 rounded-lg mr-2" disabled={loading}>
              <Text className="text-ink">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} className="bg-brand-500 px-4 py-2 rounded-lg" disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white">{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
