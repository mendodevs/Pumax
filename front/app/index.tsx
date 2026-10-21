import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import "./../global.css";
import { useI18n } from "../i18n";
import { useTheme } from "../context/SettingsContext";
import Logo from "../components/Logo";
import GoogleButton, { googleDisponible } from "../components/GoogleButton";
import { ingresarConGoogle } from "../services/account.service";

export default function LoginScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { login, establecerSesion, isAuthenticated, isLoading: authLoading } = useAuth();

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

  // Ingreso con Google: el token se verifica en el servidor; acá solo se usa la respuesta
  const handleGoogle = async (idToken: string) => {
    setError("");
    setGoogleLoading(true);

    try {
      const res = await ingresarConGoogle({ idToken, modo: "login" });

      if (res.success && res.data && res.token) {
        await establecerSesion(res.data, res.token);
        router.replace("/dashboard/Home");
      } else {
        setError(res.message || t("login.failed"));
      }
    } catch (err) {
      setError(t("login.connection"));
    } finally {
      setGoogleLoading(false);
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

        <TouchableOpacity
          onPress={() => router.push("/olvide-password")}
          disabled={loading || googleLoading}
        >
          <Text className="text-center text-gray-400 text-sm mt-4 underline">
            {t("login.forgot")}
          </Text>
        </TouchableOpacity>

        {googleDisponible ? (
          <>
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-gray-500 text-xs mx-3">o</Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>

            <GoogleButton
              texto="Ingresar con Google"
              disabled={loading}
              cargando={googleLoading}
              onIdToken={handleGoogle}
              onError={setError}
            />
          </>
        ) : null}

        <TouchableOpacity
          onPress={() => router.push("/registro")}
          disabled={loading || googleLoading}
        >
          <Text className="text-center text-gray-400 text-sm mt-5">
            ¿No tenés cuenta? <Text className="text-brand-400 font-semibold">Creá una</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}