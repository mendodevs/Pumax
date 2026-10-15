import type { ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { AlertTriangle, Check, X, type LucideIcon } from "lucide-react-native";
import { colors } from "../constants/theme";
import { useI18n } from "../i18n";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  submitText?: string;
  submitting?: boolean;
  /** Error devuelto por el servidor al guardar */
  error?: string | null;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
};

/** Ventana de formulario de Pumax: encabezado con ícono, cuerpo con scroll y botones. */
export default function FormModal({
  visible,
  title,
  subtitle,
  icon: Icon,
  submitText,
  submitting = false,
  error,
  onClose,
  onSubmit,
  children,
}: Props) {
  const { t } = useI18n();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-black/70 items-center justify-center px-4"
      >
        <View
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden"
          style={{ maxWidth: 520, maxHeight: height * 0.9 }}
        >
          <View className="h-1 bg-wine-600" />

          {/* Encabezado */}
          <View className="flex-row items-center px-5 pt-4 pb-3">
            <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
              <Icon color={colors.wineLight} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-lg font-bold">{title}</Text>
              {subtitle ? <Text className="text-slate-400 text-sm">{subtitle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              className="w-9 h-9 rounded-full bg-slate-700 items-center justify-center"
            >
              <X color="#fff" size={18} />
            </TouchableOpacity>
          </View>

          {/* Campos */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View className="flex-row items-start bg-red-500/20 border border-red-500 rounded-xl px-3 py-3 mb-4">
                <AlertTriangle color={colors.danger} size={18} />
                <Text className="text-ink ml-2 flex-1">{error}</Text>
              </View>
            ) : null}
            {children}
          </ScrollView>

          {/* Botones */}
          <View className="flex-row justify-end px-5 py-4 border-t border-slate-700">
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              className="px-5 py-3 rounded-xl bg-slate-700 mr-3"
            >
              <Text className="text-ink font-semibold">{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSubmit}
              disabled={submitting}
              className={`flex-row items-center justify-center px-5 py-3 rounded-xl min-w-[120px] ${
                submitting ? "bg-brand-700" : "bg-brand-500 active:bg-brand-700"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check color="#fff" size={18} />
                  <Text className="text-white font-bold ml-2">{submitText ?? t("common.save")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
