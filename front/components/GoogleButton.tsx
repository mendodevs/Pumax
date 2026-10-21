import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// En web cierra la ventana emergente de Google al volver a la app
WebBrowser.maybeCompleteAuthSession();

/**
 * IDs de cliente de Google (Google Cloud Console -> Credenciales -> ID de cliente de OAuth).
 * Van en el .env del front. Hace falta el de la plataforma donde corre la app:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID      (web / PWA)
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID  (Android)
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID      (iOS)
 * Y TODOS tienen que estar también en GOOGLE_CLIENT_IDS del back (separados por coma).
 */
const IDS = {
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

/** false si falta el ID de esta plataforma: en ese caso el botón no se muestra */
export const googleDisponible = Boolean(
  Platform.select({ web: IDS.web, ios: IDS.ios, android: IDS.android })
);

interface Props {
  texto: string;
  disabled?: boolean;
  cargando?: boolean;
  /** Se llama con el idToken de Google; el servidor lo verifica */
  onIdToken: (idToken: string) => void;
  onError: (mensaje: string) => void;
}

// El hook de Google falla si falta el ID de la plataforma, por eso vive en un
// componente aparte que solo se monta cuando googleDisponible es true.
function BotonActivo({ texto, disabled, cargando, onIdToken, onError }: Props) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: IDS.web,
    webClientId: IDS.web,
    iosClientId: IDS.ios,
    androidClientId: IDS.android,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (idToken) {
        onIdToken(idToken);
      } else {
        onError('Google no devolvió el token. Probá de nuevo.');
      }
    } else if (response.type === 'error') {
      onError('No se pudo completar el ingreso con Google.');
    }
    // "dismiss" / "cancel": cerró la ventana, no es un error
  }, [response]);

  const bloqueado = Boolean(disabled || cargando || !request);

  return (
    <TouchableOpacity
      onPress={() => promptAsync()}
      disabled={bloqueado}
      className={`bg-white rounded-lg py-3 border border-slate-300 ${
        bloqueado ? 'opacity-50' : 'active:bg-slate-100'
      }`}
    >
      {cargando ? (
        <ActivityIndicator color="#334155" />
      ) : (
        <Text className="text-center text-slate-800 font-semibold text-base">{texto}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function GoogleButton(props: Props) {
  if (!googleDisponible) return null;
  return <BotonActivo {...props} />;
}
