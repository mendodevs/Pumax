import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import "./../global.css";
import { useTheme } from "../context/SettingsContext";
import Logo from "../components/Logo";
import GoogleButton, { googleDisponible } from "../components/GoogleButton";
import { registrar, ingresarConGoogle } from "../services/registro.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

export default function RegistroScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { establecerSesion, isAuthenticated, isLoading: authLoading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [negocio, setNegocio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [promos, setPromos] = useState(false); // opt-in: arranca sin marcar
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const apellidoRef = useRef<TextInput>(null);
  const negocioRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const repetirRef = useRef<TextInput>(null);

  const ocupado = loading || googleLoading;

  // Si ya hay sesión, no tiene sentido estar acá
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard/Home");
    }
  }, [isAuthenticated, authLoading]);

  const entrar = async (usuario: Parameters<typeof establecerSesion>[0], token: string) => {
    await establecerSesion(usuario, token);
    router.replace("/dashboard/Home");
  };

  const handleRegistro = async () => {
    setError("");

    const nombreNegocio = negocio.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!nombre.trim()) return setError("Ingresá tu nombre.");
    if (!apellido.trim()) return setError("Ingresá tu apellido.");
    if (!nombreNegocio) return setError("Ingresá el nombre de tu negocio.");
    if (!EMAIL_REGEX.test(emailLimpio)) return setError("Ingresá un email válido.");
    if (password.length < PASSWORD_MIN) {
      return setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
    }
    if (password !== repetir) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await registrar({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        nombre_negocio: nombreNegocio,
        email: emailLimpio,
        password,
        acepta_promociones: promos,
      });

      if (res.success && res.data && res.token) {
        await entrar(res.data, res.token);
      } else {
        setError(res.message || "No se pudo crear la cuenta.");
      }
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Registro con Google: usa el nombre de negocio si ya lo escribió; si no, el servidor
  // arma uno con el nombre de la cuenta de Google (se puede cambiar después).
  const handleGoogle = async (idToken: string) => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await ingresarConGoogle({
        idToken,
        modo: "registro",
        nombre_negocio: negocio.trim() || undefined,
        acepta_promociones: promos,
      });

      if (res.success && res.data && res.token) {
        await entrar(res.data, res.token);
      } else {
        setError(res.message || "No se pudo crear la cuenta con Google.");
      }
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputClase =
    "border border-slate-600 focus:border-brand-400 rounded-lg px-3 py-2 mb-4 text-ink";

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-sm bg-slate-900 p-6 rounded-2xl shadow-lg border-t-4 border-wine-600">
        <View className="items-center mb-4">
          <Logo width={190} />
        </View>

        <Text className="text-ink text-lg font-semibold mb-4 text-center">Crear cuenta</Text>

        <Text className="text-ink mb-1">Tu nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
          placeholderTextColor={theme.placeholder}
          className={inputClase}
          autoComplete="given-name"
          editable={!ocupado}
          returnKeyType="next"
          onSubmitEditing={() => apellidoRef.current?.focus()}
        />

        <Text className="text-ink mb-1">Tu apellido</Text>
        <TextInput
          ref={apellidoRef}
          value={apellido}
          onChangeText={setApellido}
          placeholder="Apellido"
          placeholderTextColor={theme.placeholder}
          className={inputClase}
          autoComplete="family-name"
          editable={!ocupado}
          returnKeyType="next"
          onSubmitEditing={() => negocioRef.current?.focus()}
        />

        <Text className="text-ink mb-1">Nombre de tu negocio</Text>
        <TextInput
          ref={negocioRef}
          value={negocio}
          onChangeText={setNegocio}
          placeholder="Ej: Ferretería Norte"
          placeholderTextColor={theme.placeholder}
          className={inputClase}
          editable={!ocupado}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <Text className="text-ink mb-1">Email</Text>
        <TextInput
          ref={emailRef}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={theme.placeholder}
          className={inputClase}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!ocupado}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <Text className="text-ink mb-1">Contraseña</Text>
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
          placeholderTextColor={theme.placeholder}
          className={inputClase}
          secureTextEntry
          editable={!ocupado}
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
          editable={!ocupado}
          returnKeyType="go"
          onSubmitEditing={handleRegistro}
        />

        <TouchableOpacity
          onPress={() => setPromos(!promos)}
          disabled={ocupado}
          className="flex-row items-center mb-4"
        >
          <View
            className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
              promos ? "bg-brand-500 border-brand-500" : "border-slate-500"
            }`}
          >
            {promos ? <Text className="text-white text-xs">✓</Text> : null}
          </View>
          <Text className="text-ink text-sm flex-1">
            Quiero recibir novedades y promociones por email
          </Text>
        </TouchableOpacity>

        {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleRegistro}
          disabled={ocupado}
          className={`bg-brand-500 rounded-lg py-3 ${ocupado ? "opacity-50" : "active:bg-brand-700"}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center text-white font-semibold text-base">Crear cuenta</Text>
          )}
        </TouchableOpacity>

        {googleDisponible ? (
          <>
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-gray-500 text-xs mx-3">o</Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>

            <GoogleButton
              texto="Registrarme con Google"
              disabled={loading}
              cargando={googleLoading}
              onIdToken={handleGoogle}
              onError={setError}
            />
          </>
        ) : null}

        <TouchableOpacity onPress={() => router.replace("/")} disabled={ocupado}>
          <Text className="text-center text-gray-400 text-sm mt-5">
            ¿Ya tenés cuenta? <Text className="text-brand-400 font-semibold">Ingresá</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}