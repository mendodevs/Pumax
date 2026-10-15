import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, useWindowDimensions, TouchableOpacity, Modal } from "react-native";
import { Slot, Stack, router, useSegments } from "expo-router";
import { Menu as MenuIcon, X } from "lucide-react-native";
import Menu from "../../components/Menu";
import { useAuth } from "../../hooks/useAuth";
import { useAlertWatcher } from "../../hooks/useAlertWatcher";
import { useTheme } from "../../context/SettingsContext";
import { useI18n } from "../../i18n";

export default function DashboardLayout() {


  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const theme = useTheme();
  const { t } = useI18n();

  // Avisos de pedidos nuevos y stock bajo (solo actúa si la persona los activó en Configuración)
  useAlertWatcher();
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);

  // Detectar si es móvil (menos de 768px)
  const isMobile = width < 768;

  useEffect(() => {
    // Esperar a que termine de cargar la sesión
    if (isLoading) return;

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    // Si estamos justo en /dashboard sin subruta, redirigir al home
    if (segments?.[1] === undefined) {
      router.replace("/dashboard/Home");
    }
  }, [segments, isAuthenticated, isLoading]);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color={theme.accent} />
        <Text className="text-ink mt-4">{t("session.verifying")}</Text>
      </View>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View className="flex-1 flex-row">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Menú para PC - siempre visible */}
      {!isMobile && <Menu />}

      {/* Botón hamburguesa para móvil */}
      {isMobile && (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="absolute top-4 left-4 z-50 bg-slate-800 p-3 rounded-lg"
          style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }}
        >
          <MenuIcon color={theme.accent} size={24} />
        </TouchableOpacity>
      )}

      {/* Modal del menú para móvil */}
      {isMobile && (
        <Modal
          visible={menuVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMenuVisible(false)}
        >
          <View className="flex-1 flex-row">
            {/* Menú lateral */}
            <View className="w-4/5 bg-slate-800">
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                className="absolute top-4 right-4 z-50 bg-slate-900 p-2 rounded-lg"
              >
                <X color={theme.accent} size={24} />
              </TouchableOpacity>
              <Menu />
            </View>

            {/* Overlay para cerrar */}
            <TouchableOpacity
              className="flex-1 bg-black/50"
              onPress={() => setMenuVisible(false)}
              activeOpacity={1}
            />
          </View>
        </Modal>
      )}

      <View className="flex-1 bg-slate-900">
        <Slot />
      </View>
    </View>
  );
}
