import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import "./../global.css";
import { useI18n } from "../i18n";
import { useTheme } from "../context/SettingsContext";
import Logo from "../components/Logo";

export default function LoginScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard/Home");
    }
  }, [isAuthenticated, authLoading]);

  const handleLogin = async () => {
    // Limpiar error anterior
    setError("");

    // Validación básica
    if (!username.trim() || !password.trim()) {
      setError(t("login.empty"));
      return;
    }

    setLoading(true);

    try {
      const result = await login({ username, password });

      if (result.success) {
        // El AuthContext ya guardó el usuario
        // La navegación se maneja en el useEffect
        router.replace("/dashboard/Home");
      } else {
        setError(result.message || t("login.failed"));
      }
    } catch (err) {
      setError(t("login.connection"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-4">
      <View className="w-full max-w-sm bg-slate-900 p-6 rounded-2xl shadow-lg border-t-4 border-wine-600">
        <View className="items-center mb-6">
          <Logo width={190} />
        </View>

        <Text className="text-ink mb-1">{t("login.username")}</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder={t("login.usernamePlaceholder")}
          placeholderTextColor={theme.placeholder}
          className="border border-slate-600 focus:border-brand-400 rounded-lg px-3 py-2 mb-4 text-ink"
          autoCapitalize="none"
          editable={!loading}
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <Text className="text-ink mb-1">{t("login.password")}</Text>
        <TextInput
          ref={passwordInputRef}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={theme.placeholder}
          className="border border-slate-600 focus:border-brand-400 rounded-lg px-3 py-2 mb-2 text-ink"
          secureTextEntry
          editable={!loading}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        {error ? (
          <Text className="text-red-500 text-sm mb-4">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`bg-brand-500 rounded-lg py-3 ${loading ? 'opacity-50' : 'active:bg-brand-700'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center text-white font-semibold text-base">
              {t("login.submit")}
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-center text-gray-500 text-sm mt-4">
          {t("login.forgot")}
        </Text>
      </View>
    </View>
  );
}