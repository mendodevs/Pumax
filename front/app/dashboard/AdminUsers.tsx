import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import {
  AlertTriangle,
  ChevronLeft,
  KeyRound,
  Pencil,
  Plus,
  Power,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react-native";
import { useUsers } from "../../hooks/useUsers";
import { useAuth } from "../../hooks/useAuth";
import { useNotice } from "../../hooks/useNotice";
import { setUserActive, type Rol, type User } from "../../services/users.service";
import ConfirmDialog from "../../components/ConfirmDialog";
import NoticeBanner from "../../components/NoticeBanner";
import CredentialsDialog from "../../components/CredentialsDialog";
import { Badge } from "../../components/ListScreen";
import NewUserModal, { ROLES } from "../../components/modals/NewUserModal";
import EditUserModal from "../../components/modals/EditUserModal";
import ResetPasswordModal from "../../components/modals/ResetPasswordModal";
import { colors } from "../../constants/theme";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

type StatusFilter = "all" | "active" | "inactive";
type Credentials = { username: string; password: string; reset: boolean };

const ALL_ROLES: Rol[] = ["ADMIN", ...ROLES.filter((r) => r !== "ADMIN")];

const nameOf = (u: User) =>
  u.empleado ? `${u.empleado.nombre} ${u.empleado.apellido}`.trim() : u.username;

const digits = (s: string) => s.replace(/\D/g, "");

/* ---------- Piezas ---------- */

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`px-4 py-2 rounded-full border mr-2 mb-2 ${
        active ? "bg-brand-500 border-brand-400" : "bg-slate-800 border-slate-700"
      }`}
    >
      <Text className={active ? "text-white font-semibold text-sm" : "text-slate-300 text-sm"}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "wine" | "amber" }) {
  const color = tone === "wine" ? "text-wine-400" : tone === "amber" ? "text-amber-400" : "text-ink";
  return (
    <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4" style={{ flex: 1, minWidth: 130 }}>
      <Text className="text-slate-400 text-xs">{label}</Text>
      <Text className={`text-2xl font-bold mt-1 ${color}`}>{value}</Text>
    </View>
  );
}

function Avatar({ user }: { user: User }) {
  const initial = nameOf(user).charAt(0).toUpperCase();
  return (
    <View
      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
        user.activo ? (user.rol === "ADMIN" ? "bg-wine-600" : "bg-brand-700") : "bg-slate-600"
      }`}
    >
      <Text className="text-white font-bold">{initial}</Text>
    </View>
  );
}

function IconButton({
  icon: Icon,
  label,
  color,
  bg = "bg-slate-700",
  onPress,
}: {
  icon: typeof Pencil;
  label: string;
  color: string;
  bg?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // @ts-expect-error: title solo existe en la web (texto al pasar el mouse)
      title={label}
      className={`p-2 rounded-lg ml-2 ${bg}`}
    >
      <Icon color={color} size={16} />
    </TouchableOpacity>
  );
}

/* ---------- Pantalla ---------- */

export default function AdminUsers() {
  const { t, tn, locale } = useI18n();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user: me } = useAuth();
  const { users, loading, error, refetch } = useUsers();
  const { notice, showNotice } = useNotice();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [role, setRole] = useState<Rol | "ALL">("ALL");

  const [newVisible, setNewVisible] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [toggling, setToggling] = useState<User | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const myId = me ? Number(me.id) : -1;

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.activo).length,
      admins: users.filter((u) => u.activo && u.rol === "ADMIN").length,
      inactive: users.filter((u) => !u.activo).length,
      noProfile: users.filter((u) => u.activo && !u.empleado).length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = digits(q);
    return users.filter((u) => {
      if (status === "active" && !u.activo) return false;
      if (status === "inactive" && u.activo) return false;
      if (role !== "ALL" && u.rol !== role) return false;
      if (!q) return true;
      return (
        nameOf(u).toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.empleado?.cargo ?? "").toLowerCase().includes(q) ||
        (qDigits.length > 0 && digits(u.empleado?.dni ?? "").includes(qDigits))
      );
    });
  }, [users, search, status, role]);

  const formatAccess = (value: string | null) => {
    if (!value) return t("users.never");
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? t("users.never") : d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  };

  /* ---------- Acciones ---------- */

  const showCredentials = (c: { username: string; passwordTemporal?: string }, reset: boolean) => {
    refetch();
    if (c.passwordTemporal) {
      setCredentials({ username: c.username, password: c.passwordTemporal, reset });
    } else {
      showNotice("success", t(reset ? "users.notice.passwordReset" : "users.notice.created"));
    }
  };

  const confirmToggle = async () => {
    if (!toggling) return;
    setToggleBusy(true);
    const target = toggling;
    try {
      await setUserActive(target.id, !target.activo);
      showNotice("success", t(target.activo ? "users.notice.deactivated" : "users.notice.activated", { name: nameOf(target) }));
      refetch();
    } catch (err) {
      const reason = err instanceof Error && err.message ? `: ${err.message}` : "";
      showNotice("error", t("users.notice.failed", { reason }));
    } finally {
      setToggleBusy(false);
      setToggling(null);
    }
  };

  /* ---------- Filas ---------- */

  const actions = (u: User) => {
    const self = Number(u.id) === myId;
    return (
      <View className="flex-row items-center">
        <IconButton icon={Pencil} label={t("users.action.edit")} color={colors.brandLight} onPress={() => setEditing(u)} />
        {!self && (
          <>
            <IconButton icon={KeyRound} label={t("users.action.reset")} color={colors.brandLight} onPress={() => setResetting(u)} />
            <IconButton
              icon={u.activo ? Power : UserCheck}
              label={t(u.activo ? "users.action.deactivate" : "users.action.activate")}
              color={u.activo ? colors.danger : colors.brandLight}
              bg={u.activo ? "bg-red-600/20" : "bg-slate-700"}
              onPress={() => setToggling(u)}
            />
          </>
        )}
      </View>
    );
  };

  const identity = (u: User) => (
    <View className="flex-row items-center flex-1">
      <Avatar user={u} />
      <View className="flex-1">
        <View className="flex-row items-center flex-wrap">
          <Text className="text-ink font-semibold mr-2" numberOfLines={1}>
            {nameOf(u)}
          </Text>
          {Number(u.id) === myId && <Badge text={t("users.you")} tone="wine" />}
        </View>
        <Text className="text-slate-400 text-xs" numberOfLines={1}>
          @{u.username}
          {u.empleado?.cargo ? ` · ${u.empleado.cargo}` : ""}
        </Text>
      </View>
    </View>
  );

  const renderDesktopRow = ({ item: u }: { item: User }) => (
    <View
      className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-2"
      style={{ opacity: u.activo ? 1 : 0.6 }}
    >
      <View style={{ flex: 2.4 }} className="pr-3">
        {identity(u)}
      </View>
      <View style={{ flex: 1.2 }} className="pr-3">
        <Badge text={t(`account.role.${u.rol}`)} tone={u.rol === "ADMIN" ? "wine" : "brand"} />
      </View>
      <View style={{ flex: 1.1 }} className="pr-3">
        <View className="flex-row items-center flex-wrap">
          <Badge text={t(u.activo ? "users.status.active" : "users.status.inactive")} tone={u.activo ? "brand" : "amber"} />
          {!u.empleado && (
            <View className="ml-2">
              <Badge text={t("users.noProfile.badge")} tone="amber" />
            </View>
          )}
        </View>
      </View>
      <Text style={{ flex: 1.5 }} className="text-slate-300 text-sm pr-3" numberOfLines={1}>
        {formatAccess(u.ultimo_acceso)}
      </Text>
      <View style={{ width: 130 }} className="items-end">
        {actions(u)}
      </View>
    </View>
  );

  const renderMobileCard = ({ item: u }: { item: User }) => (
    <View
      className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3"
      style={{ opacity: u.activo ? 1 : 0.6 }}
    >
      <View className="flex-row items-start">
        {identity(u)}
      </View>
      <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
        <Badge text={t(`account.role.${u.rol}`)} tone={u.rol === "ADMIN" ? "wine" : "brand"} />
        <Badge text={t(u.activo ? "users.status.active" : "users.status.inactive")} tone={u.activo ? "brand" : "amber"} />
        {!u.empleado && <Badge text={t("users.noProfile.badge")} tone="amber" />}
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-1 pr-2">
          {u.empleado?.dni ? (
            <Text className="text-slate-400 text-xs">
              {t("users.dni")} {u.empleado.dni}
            </Text>
          ) : null}
          <Text className="text-slate-400 text-xs">
            {t("users.lastAccess")}: {formatAccess(u.ultimo_acceso)}
          </Text>
        </View>
        {actions(u)}
      </View>
    </View>
  );

  /* ---------- Estados ---------- */

  if (loading && users.length === 0) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brandLight} />
        <Text className="text-ink mt-4">{t("users.loading")}</Text>
      </View>
    );
  }

  if (error && users.length === 0) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-4">
        <AlertTriangle color={colors.danger} size={48} />
        <Text className="text-ink text-lg mt-4 text-center">{t("users.loadError")}</Text>
        <Text className="text-slate-400 text-sm mt-1 text-center">{error}</Text>
        <TouchableOpacity onPress={refetch} className="bg-brand-500 px-6 py-3 rounded-xl mt-4">
          <Text className="text-white font-semibold">{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------- Pantalla ---------- */

  const header = (
    <View>
      <TouchableOpacity
        onPress={() => router.push("/dashboard/Users")}
        className="flex-row items-center self-start mb-3"
        accessibilityRole="button"
      >
        <ChevronLeft color={theme.accent} size={18} />
        <Text className="text-brand-400 text-sm font-semibold">{t("users.back")}</Text>
      </TouchableOpacity>

      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center flex-1 pr-3">
          <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
            <Users color={colors.wineLight} size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-ink">{t("users.title")}</Text>
            <Text className="text-slate-400 text-sm">{t("users.subtitle")}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setNewVisible(true)}
          className="flex-row items-center bg-brand-500 active:bg-brand-700 rounded-xl px-4 py-3"
        >
          <Plus color="#fff" size={18} />
          <Text className="text-white font-bold ml-1">{isMobile ? t("users.newShort") : t("users.new")}</Text>
        </TouchableOpacity>
      </View>

      <NoticeBanner notice={notice} />

      <View className="flex-row flex-wrap mb-4" style={{ gap: 12 }}>
        <Stat label={t("users.stat.total")} value={stats.total} />
        <Stat label={t("users.stat.active")} value={stats.active} />
        <Stat label={t("users.stat.admins")} value={stats.admins} tone="wine" />
        <Stat label={t("users.stat.inactive")} value={stats.inactive} tone={stats.inactive > 0 ? "amber" : undefined} />
      </View>

      {stats.noProfile > 0 && (
        <View className="bg-amber-500/15 border border-amber-500 rounded-xl px-4 py-3 mb-4">
          <Text className="text-ink text-sm font-semibold">{tn("users.noProfile", stats.noProfile)}</Text>
          <Text className="text-slate-300 text-xs mt-0.5">{t("users.noProfile.hint")}</Text>
        </View>
      )}

      <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mb-3">
        <Search color={colors.muted} size={20} />
        <TextInput
          placeholder={t("users.search")}
          placeholderTextColor={theme.placeholder}
          value={search}
          onChangeText={setSearch}
          className="flex-1 ml-2 text-ink py-1"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <X color={colors.muted} size={20} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="flex-row flex-wrap">
        <Chip label={t("users.filter.all")} active={status === "all"} onPress={() => setStatus("all")} />
        <Chip label={t("users.filter.active")} active={status === "active"} onPress={() => setStatus("active")} />
        <Chip label={t("users.filter.inactive")} active={status === "inactive"} onPress={() => setStatus("inactive")} />
      </View>
      <View className="flex-row flex-wrap">
        <Chip label={t("users.filter.allRoles")} active={role === "ALL"} onPress={() => setRole("ALL")} />
        {ALL_ROLES.map((r) => (
          <Chip key={r} label={t(`account.role.${r}`)} active={role === r} onPress={() => setRole(r)} />
        ))}
      </View>

      <Text className="text-slate-400 text-xs mb-3 ml-1">
        {t("lists.count", { shown: filtered.length, total: users.length })}
      </Text>

      {!isMobile && (
        <View className="flex-row items-center px-4 pb-2">
          <Text style={{ flex: 2.4 }} className="text-slate-400 text-xs font-semibold uppercase pr-3">
            {t("users.col.user")}
          </Text>
          <Text style={{ flex: 1.2 }} className="text-slate-400 text-xs font-semibold uppercase pr-3">
            {t("users.col.role")}
          </Text>
          <Text style={{ flex: 1.1 }} className="text-slate-400 text-xs font-semibold uppercase pr-3">
            {t("users.col.status")}
          </Text>
          <Text style={{ flex: 1.5 }} className="text-slate-400 text-xs font-semibold uppercase pr-3">
            {t("users.col.lastAccess")}
          </Text>
          <Text style={{ width: 130 }} className="text-slate-400 text-xs font-semibold uppercase text-right">
            {t("lists.actions")}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={isMobile ? renderMobileCard : renderDesktopRow}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Users color={colors.muted} size={32} />
            <Text className="text-slate-400 mt-3">
              {users.length === 0 ? t("users.empty") : t("lists.noResults")}
            </Text>
          </View>
        }
        contentContainerStyle={{
          width: "100%",
          maxWidth: 1100,
          alignSelf: "center",
          paddingHorizontal: 16,
          paddingTop: isMobile ? 72 : 24,
          paddingBottom: 32,
        }}
      />

      <NewUserModal
        visible={newVisible}
        onClose={() => setNewVisible(false)}
        onCreated={(c) => showCredentials(c, false)}
      />

      <EditUserModal
        visible={!!editing}
        user={editing}
        isSelf={!!editing && Number(editing.id) === myId}
        onClose={() => setEditing(null)}
        onSuccess={() => {
          refetch();
          showNotice("success", t("users.notice.updated"));
        }}
      />

      <ResetPasswordModal
        visible={!!resetting}
        user={resetting}
        name={resetting ? nameOf(resetting) : ""}
        onClose={() => setResetting(null)}
        onDone={(c) => showCredentials(c, true)}
      />

      <ConfirmDialog
        visible={!!toggling}
        title={t(toggling?.activo ? "users.deactivate.title" : "users.activate.title")}
        message={t(toggling?.activo ? "users.deactivate.message" : "users.activate.message", {
          name: toggling ? nameOf(toggling) : "",
        })}
        confirmText={t(toggling?.activo ? "users.deactivate.confirm" : "users.activate.confirm")}
        destructive={!!toggling?.activo}
        loading={toggleBusy}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />

      <CredentialsDialog
        visible={!!credentials}
        reset={credentials?.reset}
        username={credentials?.username ?? ""}
        password={credentials?.password ?? ""}
        onClose={() => setCredentials(null)}
      />
    </View>
  );
}
