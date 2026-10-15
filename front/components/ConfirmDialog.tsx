import { useI18n } from "../i18n";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmación propia. Funciona igual en celular y en web
 * (Alert.alert con botones no responde en la versión web).
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <Text className="text-ink text-lg font-bold mb-2">{title}</Text>
          <Text className="text-slate-300 mb-5">{message}</Text>

          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-700 mr-2"
            >
              <Text className="text-ink font-semibold">{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl min-w-[100px] items-center ${
                destructive ? "bg-red-600" : "bg-brand-500"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">{confirmText ?? t("forms.confirm")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
