import { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";
import { Check, Copy, KeyRound } from "lucide-react-native";
import { colors } from "../constants/theme";
import { useI18n } from "../i18n";

type Props = {
  visible: boolean;
  /** true cuando es una contraseña reiniciada (cambia el título) */
  reset?: boolean;
  username: string;
  password: string;
  onClose: () => void;
};

const canCopy = () => Platform.OS === "web" && typeof navigator !== "undefined" && !!navigator.clipboard;

/**
 * Muestra una sola vez la contraseña temporal que generó el servidor.
 * El botón "Copiar" aparece solo en la web (en el celular se puede mantener apretado el texto).
 */
export default function CredentialsDialog({ visible, reset, username, password, onClose }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) setCopied(false);
  }, [visible]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${t("users.cred.user")}: ${username}\n${t("users.cred.password")}: ${password}`);
      setCopied(true);
    } catch {
      // sin permiso del navegador: la persona puede seleccionar el texto a mano
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <View className="h-1 bg-wine-600" />
          <View className="p-5">
            <View className="flex-row items-center mb-3">
              <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
                <KeyRound color={colors.wineLight} size={22} />
              </View>
              <Text className="text-ink text-lg font-bold flex-1">
                {reset ? t("users.cred.titleReset") : t("users.cred.title")}
              </Text>
            </View>
            <Text className="text-slate-300 text-sm mb-4">{t("users.cred.message")}</Text>

            <View className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 mb-3">
              <Text className="text-slate-400 text-xs">{t("users.cred.user")}</Text>
              <Text selectable className="text-ink text-base font-semibold">
                {username}
              </Text>
            </View>
            <View className="bg-slate-900 border border-brand-500 rounded-xl px-4 py-3 mb-4">
              <Text className="text-slate-400 text-xs">{t("users.cred.password")}</Text>
              <Text
                selectable
                className="text-ink text-xl font-bold"
                style={{ letterSpacing: 1, fontFamily: Platform.OS === "web" ? "monospace" : undefined }}
              >
                {password}
              </Text>
            </View>

            <View className="flex-row justify-end">
              {canCopy() && (
                <TouchableOpacity
                  onPress={copy}
                  className="flex-row items-center px-4 py-3 rounded-xl bg-slate-700 mr-2"
                >
                  {copied ? <Check color={colors.brandLight} size={18} /> : <Copy color={colors.brandLight} size={18} />}
                  <Text className="text-ink font-semibold ml-2">
                    {copied ? t("users.cred.copied") : t("users.cred.copy")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} className="px-5 py-3 rounded-xl bg-brand-500">
                <Text className="text-white font-bold">{t("users.cred.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
