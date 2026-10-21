import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import "./../global.css";
import { useTheme } from "../context/SettingsContext";
import Logo from "../components/Logo";
import { restablecerPassword } from "../services/registro.service";

const PASSWORD_MIN = 8;

/**
 * Se abre desde el link del mail: /restablecer-password?token=...
 * (el back arma ese link con APP_URL, que tiene que apuntar a la versión web de la app)
 */
export default function RestablecerPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const repetirRef = useRef<TextInput>(null);

  const guardar = async () => {
    setError("");

    if (!token) {
      setError("El enlace no es válido. Pedí uno nuevo.");
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
      return;
    }
    if (password !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await restablecerPassword(token, password);
    setLoading(false);

    if (res.success) {
      setListo(true);
    } else {
      setError(res.message || "No se pudo cambiar la contraseña.");
    }
  };

  const inputClase =
    "border border-slate-600 focus:border-brand-400 rounded-lg px-3 py-2 mb-4 text-ink";

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-4">
      <View className="w-full max-w-sm bg-slate-900 p-6 rounded-2xl shadow-lg border-t-4 border-wine-600">
        <View className="items-center mb-4">
          <Logo width={190} />
        </View>

        <Text className="text-ink text-lg font-semibold mb-4 text-center">
          Elegir contraseña nueva
        </Text>

        {listo ? (
          <>
            <Text className="text-ink text-sm mb-6 text-center">
              Tu contraseña se actualizó. Ya podés ingresar con la nueva.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/")}
              className="bg-brand-500 rounded-lg py-3 active:bg-brand-700"
            >
              <Text className="text-center text-white font-semibold text-base">Ir a ingresar</Text>
            </TouchableOpacity>
          </>
        ) : !token ? (
          <>
            <Text className="text-red-500 text-sm mb-6 text-center">
              El enlace no es válido o está incompleto.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/olvide-password")}
              className="bg-brand-500 rounded-lg py-3 active:bg-brand-700"
            >
              <Text className="text-center text-white font-semibold text-base">
                Pedir un enlace nuevo
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-ink mb-1">Contraseña nueva</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
              placeholderTextColor={theme.placeholder}
              className={inputClase}
              secureTextEntry
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => repetirRef.current?.focus()}
            />

            <Text className="text-ink mb-1">Repetir contraseña</Text>
            <TextInput
              ref={repetirRef}
              value={repetir}
              onChangeText={setRepetir}
              placeholder="••••••••"
              placeholderTextColor={theme.placeholder}
              className={inputClase}
              secureTextEntry
              editable={!loading}
              returnKeyType="go"
              onSubmitEditing={guardar}
            />

            {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

            <TouchableOpacity
              onPress={guardar}
              disabled={loading}
              className={`bg-brand-500 rounded-lg py-3 ${
                loading ? "opacity-50" : "active:bg-brand-700"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-white font-semibold text-base">
                  Cambiar contraseña
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/olvide-password")} disabled={loading}>
              <Text className="text-center text-gray-400 text-sm mt-5 underline">
                Pedir un enlace nuevo
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
