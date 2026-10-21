import { useEffect, useState, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import {
  AlertTriangle,
  ChevronRight,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import { useMyAccount } from "../../hooks/useMyAccount";
import { useNotice } from "../../hooks/useNotice";
import { changeMyPassword, updateMyAccount } from "../../services/account.service";
import type { Account } from "../../types/account.types";
import { Field, FieldRow } from "../../components/FormFields";
import { Badge } from "../../components/ListScreen";
import NoticeBanner from "../../components/NoticeBanner";
import { colors } from "../../constants/theme";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

/* ---------- Utilidades ---------- */

const profileFromAccount = (a: Account | null) => ({
  nombre: a?.empleado?.nombre ?? "",
  apellido: a?.empleado?.apellido ?? "",
  email: a?.empleado?.email ?? "",
  telefono: a?.empleado?.telefono ?? "",
  direccion: a?.empleado?.direccion ?? "",
});

/** "2024-03-15" -> "15 de marzo de 2024" (sin corrimiento por zona horaria) */
function formatDateOnly(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString(locale, { dateStyle: "long", timeStyle: "short" });
}

/** 0 a 3 */
function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return Math.min(score, 3);
}

/* ---------- Piezas de la pantalla ---------- */

function Card({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-4">
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg bg-brand-700 items-center justify-center mr-3">
          <Icon color={colors.brandLight} size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-ink font-bold text-base">{title}</Text>
          {subtitle ? <Text className="text-slate-400 text-xs">{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row justify-between items-center py-2.5 border-t border-slate-700">
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className={`text-sm flex-1 text-right ml-4 ${value ? "text-ink" : "text-slate-500"}`}>
        {value || "—"}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  icon: Icon,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center rounded-xl py-3 px-5 ${
        disabled ? "bg-slate-600" : "bg-brand-500 active:bg-brand-700"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Icon color={disabled ? theme.muted : "#fff"} size={18} />
          <Text className={`font-bold ml-2 ${disabled ? "text-slate-400" : "text-white"}`}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ---------- Pantalla ---------- */

export default function MyAccountScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const twoColumns = width >= 1100;

  const { logout } = useAuth();
  const { account, setAccount, loading, error, refetch } = useMyAccount();
  const { notice, showNotice } = useNotice(5000);

  // Datos personales
  const [profile, setProfile] = useState(profileFromAccount(null));
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof typeof profile, string>>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Contraseña
  const [pw, setPw] = useState({ actual: "", nueva: "", repetir: "" });
  const [pwErrors, setPwErrors] = useState<Partial<Record<keyof typeof pw, string>>>({});
  const [pwServerError, setPwServerError] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setProfile(profileFromAccount(account));
  }, [account]);

  const original = profileFromAccount(account);
  const dirty = (Object.keys(profile) as (keyof typeof profile)[]).some(
    (k) => profile[k] !== original[k]
  );

  const setProfileField = (key: keyof typeof profile) => (value: string) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setProfileErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setPwField = (key: keyof typeof pw) => (value: string) => {
    setPw((p) => ({ ...p, [key]: value }));
    setPwErrors((e) => ({ ...e, [key]: undefined }));
    setPwServerError(null);
  };

  const saveProfile = async () => {
    const found: typeof profileErrors = {};
    if (!profile.nombre.trim()) found.nombre = t("account.err.firstName");
    if (!profile.apellido.trim()) found.apellido = t("account.err.lastName");
    if (profile.email.trim() && !EMAIL.test(profile.email.trim()))
      found.email = t("account.err.email");
    if (Object.keys(found).length) {
      setProfileErrors(found);
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateMyAccount(profile);
      setAccount(updated);
      showNotice("success", t("account.notice.saved"));
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : t("account.notice.saveFail"));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    const found: typeof pwErrors = {};
    if (!pw.actual) found.actual = t("account.err.currentPw");
    if (pw.nueva.length < PASSWORD_MIN) found.nueva = t("account.err.pwMin", { n: PASSWORD_MIN });
    else if (pw.nueva === pw.actual) found.nueva = t("account.err.pwSame");
    if (pw.repetir !== pw.nueva) found.repetir = t("account.err.pwMismatch");
    if (Object.keys(found).length) {
      setPwErrors(found);
      return;
    }

    setSavingPw(true);
    setPwServerError(null);
    try {
      await changeMyPassword(pw.actual, pw.nueva);
      setPw({ actual: "", nueva: "", repetir: "" });
      showNotice("success", t("account.notice.pwChanged"));
    } catch (err) {
      setPwServerError(err instanceof Error ? err.message : t("account.notice.pwFail"));
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  /* ---------- Estados ---------- */

  if (loading && !account) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brandLight} />
        <Text className="text-ink mt-4">{t("account.loading")}</Text>
      </View>
    );
  }

  if (error || !account) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-4">
        <AlertTriangle color={colors.danger} size={48} />
        <Text className="text-ink text-lg mt-4 text-center">
          {error || t("account.loadFail")}
        </Text>
        <TouchableOpacity onPress={refetch} className="bg-brand-500 px-6 py-3 rounded-xl mt-4">
          <Text className="text-white font-semibold">{t("account.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const emp = account.empleado;
  const fullName = emp ? `${emp.nombre} ${emp.apellido}`.trim() : account.username;
  const initials = emp
    ? `${emp.nombre[0] ?? ""}${emp.apellido[0] ?? ""}`.toUpperCase()
    : account.username.slice(0, 2).toUpperCase();
  const strength = passwordStrength(pw.nueva);
  const STRENGTH = [
    { label: t("account.strength.0"), bar: "bg-red-500", text: "text-red-400" },
    { label: t("account.strength.1"), bar: "bg-red-500", text: "text-red-400" },
    { label: t("account.strength.2"), bar: "bg-amber-500", text: "text-amber-400" },
    { label: t("account.strength.3"), bar: "bg-brand-400", text: "text-brand-400" },
  ][strength];

  /* ---------- Bloques ---------- */

  const personalData = (
    <Card icon={User} title={t("account.personal.title")} subtitle={t("account.personal.subtitle")}>
      {emp ? (
        <>
          <FieldRow>
            <Field
              label={t("account.field.firstName")}
              required
              value={profile.nombre}
              onChangeText={setProfileField("nombre")}
              error={profileErrors.nombre}
            />
            <Field
              label={t("account.field.lastName")}
              required
              value={profile.apellido}
              onChangeText={setProfileField("apellido")}
              error={profileErrors.apellido}
            />
          </FieldRow>
          <Field
            label={t("account.field.email")}
            value={profile.email}
            onChangeText={setProfileField("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={t("account.field.emailPlaceholder")}
            error={profileErrors.email}
          />
          <FieldRow>
            <Field
              label={t("account.field.phone")}
              value={profile.telefono}
              onChangeText={setProfileField("telefono")}
              keyboardType="phone-pad"
            />
            <Field
              label={t("account.field.address")}
              value={profile.direccion}
              onChangeText={setProfileField("direccion")}
            />
          </FieldRow>

          <View className="flex-row items-center justify-end" style={{ gap: 12 }}>
            {dirty && !savingProfile ? (
              <TouchableOpacity
                onPress={() => {
                  setProfile(original);
                  setProfileErrors({});
                }}
              >
                <Text className="text-slate-300 font-semibold">{t("account.discard")}</Text>
              </TouchableOpacity>
            ) : null}
            <PrimaryButton
              label={t("account.saveChanges")}
              icon={Save}
              onPress={saveProfile}
              disabled={!dirty}
              loading={savingProfile}
            />
          </View>
        </>
      ) : (
        <View className="bg-slate-900 border border-slate-600 rounded-xl p-4">
          <Text className="text-slate-300">
            {t("account.noEmployee")}
          </Text>
        </View>
      )}

      {emp ? (
        <View className="mt-5">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            {t("account.company.title")}
          </Text>
          <InfoRow label={t("account.company.dni")} value={emp.dni} />
          <InfoRow label={t("account.company.position")} value={emp.cargo} />
          <InfoRow label={t("account.company.hireDate")} value={formatDateOnly(emp.fecha_ingreso, locale)} />
        </View>
      ) : null}
    </Card>
  );

  const security = (
    <Card icon={KeyRound} title={t("account.pw.title")} subtitle={t("account.pw.subtitle", { n: PASSWORD_MIN })}>
      <Field
        label={t("account.pw.current")}
        value={pw.actual}
        onChangeText={setPwField("actual")}
        secureTextEntry
        error={pwErrors.actual}
      />
      <Field
        label={t("account.pw.new")}
        value={pw.nueva}
        onChangeText={setPwField("nueva")}
        secureTextEntry
        error={pwErrors.nueva}
      />
      {pw.nueva ? (
        <View className="-mt-2 mb-4">
          <View className="flex-row" style={{ gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i < Math.max(1, strength) ? STRENGTH.bar : "bg-slate-600"
                }`}
              />
            ))}
          </View>
          <Text className={`${STRENGTH.text} text-xs mt-1`}>{STRENGTH.label}</Text>
        </View>
      ) : null}
      <Field
        label={t("account.pw.repeat")}
        value={pw.repetir}
        onChangeText={setPwField("repetir")}
        secureTextEntry
        error={pwErrors.repetir}
      />

      {pwServerError ? (
        <View className="flex-row items-start bg-red-500/20 border border-red-500 rounded-xl px-3 py-3 mb-4">
          <AlertTriangle color={colors.danger} size={18} />
          <Text className="text-ink ml-2 flex-1">{pwServerError}</Text>
        </View>
      ) : null}

      <View className="items-end">
        <PrimaryButton
          label={t("account.pw.change")}
          icon={KeyRound}
          onPress={savePassword}
          disabled={!pw.actual && !pw.nueva && !pw.repetir}
          loading={savingPw}
        />
      </View>
    </Card>
  );

  const session = (
    <Card icon={ShieldCheck} title={t("account.session.title")}>
      <InfoRow label={t("account.session.lastAccess")} value={formatDateTime(account.ultimo_acceso, locale)} />
      <InfoRow label={t("account.session.created")} value={formatDateOnly(account.fecha_creacion, locale)} />
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center justify-center rounded-xl py-3 mt-3 border border-slate-600 bg-slate-900"
      >
        <LogOut color={colors.wineLight} size={18} />
        <Text className="text-ink font-semibold ml-2">{t("account.session.logout")}</Text>
      </TouchableOpacity>
    </Card>
  );
//Seccion para administrar usuarios del sistema, solo visible para superadmin
  const adminCard =
    account.rol === "SUPERADMIN" ? (
      <TouchableOpacity
        onPress={() => router.push("/dashboard/AdminUsers")}
        className="flex-row items-center bg-slate-800 border border-wine-600 rounded-2xl p-5 mb-4"
      >
        <View className="w-9 h-9 rounded-lg bg-wine-600/20 items-center justify-center mr-3">
          <Users color={colors.wineLight} size={18} />
        </View>
        <View className="flex-1">
          <Text className="text-ink font-bold">{t("account.admin.title")}</Text>
          <Text className="text-slate-400 text-xs">{t("account.admin.subtitle")}</Text>
        </View>
        <ChevronRight color={theme.muted} size={20} />
      </TouchableOpacity>
    ) : null;

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: isMobile ? 72 : 24,
          paddingBottom: 32,
        }}
      >
        <View style={{ width: "100%", maxWidth: 1100, alignSelf: "center" }}>
          {/* Encabezado */}
          <View className="mb-5">
            <Text className="text-2xl font-bold text-ink">{t("account.header.title")}</Text>
            <Text className="text-slate-400 text-sm">{t("account.header.subtitle")}</Text>
          </View>

          <NoticeBanner notice={notice} />

          {/* Tarjeta de identidad */}
          <View
            className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-4"
          >
            <View className="h-1 bg-wine-600" />
            <View
              className="p-5"
              style={{
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                gap: 16,
              }}
            >
              <View className="w-20 h-20 rounded-full bg-brand-700 border-2 border-wine-400 items-center justify-center">
                <Text className="text-white text-2xl font-bold">{initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink text-2xl font-bold">{fullName}</Text>
                <Text className="text-slate-400 mb-3">@{account.username}</Text>
                <View className="flex-row" style={{ gap: 8 }}>
                  <Badge text={t(`account.role.${account.rol}`)} tone="wine" />
                  <Badge text={account.activo ? t("account.active") : t("account.inactive")} tone={account.activo ? "brand" : "amber"} />
                </View>
              </View>
            </View>
          </View>

          {adminCard}

          {twoColumns ? (
            <View style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}>
              <View style={{ flex: 1.2 }}>{personalData}</View>
              <View style={{ flex: 1 }}>
                {security}
                {session}
              </View>
            </View>
          ) : (
            <>
              {personalData}
              {security}
              {session}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
