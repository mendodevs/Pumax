import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import "./../global.css";
import { useTheme } from "../context/SettingsContext";
import Logo from "../components/Logo";
import { olvidePassword } from "../services/registro.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OlvidePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    setError("");

    const emailLimpio = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailLimpio)) {
      setError("Ingresá un email válido.");
      return;
    }

    setLoading(true);
    const res = await olvidePassword(emailLimpio);
    setLoading(false);

    if (res.success) {
      setEnviado(true);
    } else {
      setError(res.message || "No se pudo enviar el correo. Probá de nuevo.");
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-4">
      <View className="w-full max-w-sm bg-slate-900 p-6 rounded-2xl shadow-lg border-t-4 border-wine-600">
        <View className="items-center mb-4">
          <Logo width={190} />
        </View>

        <Text className="text-ink text-lg font-semibold mb-2 text-center">
          Recuperar contraseña
        </Text>

        {enviado ? (
          <>
            {/* Mismo mensaje exista o no el email: no revela qué cuentas están registradas */}
            <Text className="text-ink text-sm mb-2 text-center">
              Si el email está registrado, te enviamos un correo con las instrucciones.
            </Text>
            <Text className="text-gray-400 text-xs mb-6 text-center">
              El enlace vence en 1 hora. Si no lo ves, revisá la carpeta de spam.
            </Text>

            <TouchableOpacity
              onPress={() => router.replace("/")}
              className="bg-brand-500 rounded-lg py-3 active:bg-brand-700"
            >
              <Text className="text-center text-white font-semibold text-base">
                Volver a ingresar
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-gray-400 text-sm mb-4 text-center">
              Ingresá el email de tu cuenta y te mandamos un enlace para elegir una contraseña nueva.
            </Text>

            <Text className="text-ink mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={theme.placeholder}
              className="border border-slate-600 focus:border-brand-400 rounded-lg px-3 py-2 mb-2 text-ink"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={enviar}
            />

            {error ? <Text className="text-red-500 text-sm mb-2">{error}</Text> : null}

            <TouchableOpacity
              onPress={enviar}
              disabled={loading}
              className={`bg-brand-500 rounded-lg py-3 mt-2 ${
                loading ? "opacity-50" : "active:bg-brand-700"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-white font-semibold text-base">
                  Enviar enlace
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/")} disabled={loading}>
              <Text className="text-center text-gray-400 text-sm mt-5 underline">
                Volver a ingresar
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
