import { useEffect } from "react";
import { Text, View } from "react-native";
import { UserCog } from "lucide-react-native";
import FormModal from "../FormModal";
import { ChipSelect, Field, FieldRow, Section } from "../FormFields";
import { Badge } from "../ListScreen";
import { useFormState } from "../../hooks/useFormState";
import { updateUser, type Rol, type User } from "../../services/users.service";
import { ROLES } from "./NewUserModal";
import { useI18n } from "../../i18n";

type Props = {
  visible: boolean;
  user: User | null;
  /** true si es la cuenta de quien está mirando: el rol no se puede cambiar */
  isSelf: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const EMPTY = { nombre: "", apellido: "", dni: "", cargo: "", email: "", telefono: "", rol: "VENDEDOR" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditUserModal({ visible, user, isSelf, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { values, setValues, errors, setErrors, set, submitting, serverError, submit } = useFormState(EMPTY, visible);

  // Se declara después de useFormState, así corre después de su reinicio y pisa los valores vacíos
  useEffect(() => {
    if (visible && user) {
      setValues({
        nombre: user.empleado?.nombre ?? "",
        apellido: user.empleado?.apellido ?? "",
        dni: user.empleado?.dni ?? "",
        cargo: user.empleado?.cargo ?? "",
        email: user.empleado?.email ?? "",
        telefono: user.empleado?.telefono ?? "",
        rol: user.rol,
      });
    }
  }, [visible, user, setValues]);

  if (!user) return null;
  const hasProfile = !!user.empleado;

  const handleSave = () => {
    const found: typeof errors = {};
    const any = values.nombre.trim() || values.apellido.trim() || values.dni.trim();

    // Con ficha: los tres datos son obligatorios. Sin ficha: se crea solo si completó los tres.
    if (hasProfile || any) {
      if (!values.nombre.trim()) found.nombre = t("users.err.firstName");
      if (!values.apellido.trim()) found.apellido = t("users.err.lastName");
      if (!/^\d{6,12}$/.test(values.dni.replace(/[.\s-]/g, ""))) found.dni = t("users.err.dni");
    }
    if (values.email.trim() && !EMAIL.test(values.email.trim())) found.email = t("users.err.email");

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    submit(async () => {
      await updateUser(user.id, {
        ...(!isSelf && values.rol !== user.rol ? { rol: values.rol as Rol } : {}),
        ...(hasProfile || any
          ? {
              empleado: {
                nombre: values.nombre.trim(),
                apellido: values.apellido.trim(),
                dni: values.dni.trim(),
                cargo: values.cargo.trim(),
                email: values.email.trim(),
                telefono: values.telefono.trim(),
              },
            }
          : {}),
      });
      onSuccess();
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("users.edit.title")}
      subtitle={t("users.edit.subtitle", { username: user.username })}
      icon={UserCog}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSave}
    >
      {!hasProfile && (
        <View className="bg-amber-500/15 border border-amber-500 rounded-xl px-3 py-3 mb-4">
          <Text className="text-ink text-sm">{t("users.edit.noProfile")}</Text>
        </View>
      )}

      <Section title={t("users.section.person")} />
      <FieldRow>
        <Field
          label={t("users.field.firstName")}
          required={hasProfile}
          value={values.nombre}
          onChangeText={set("nombre")}
          autoCapitalize="words"
          error={errors.nombre}
        />
        <Field
          label={t("users.field.lastName")}
          required={hasProfile}
          value={values.apellido}
          onChangeText={set("apellido")}
          autoCapitalize="words"
          error={errors.apellido}
        />
      </FieldRow>
      <FieldRow>
        <Field
          label={t("users.field.dni")}
          required={hasProfile}
          value={values.dni}
          onChangeText={set("dni")}
          keyboardType="number-pad"
          error={errors.dni}
        />
        <Field label={t("users.field.position")} value={values.cargo} onChangeText={set("cargo")} />
      </FieldRow>
      <FieldRow>
        <Field
          label={t("users.field.email")}
          value={values.email}
          onChangeText={set("email")}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Field
          label={t("users.field.phone")}
          value={values.telefono}
          onChangeText={set("telefono")}
          keyboardType="phone-pad"
        />
      </FieldRow>

      <Section title={t("users.section.access")} />
      {isSelf ? (
        <View className="mb-4">
          <Text className="text-slate-300 text-sm font-semibold mb-1.5">{t("users.field.role")}</Text>
          <Badge text={t(`account.role.${user.rol}`)} tone="wine" />
          <Text className="text-slate-500 text-xs mt-2">{t("users.edit.selfRole")}</Text>
        </View>
      ) : (
        <ChipSelect
          label={t("users.field.role")}
          options={ROLES.map((r) => ({ value: r as string, label: t(`account.role.${r}`) }))}
          value={values.rol}
          onChange={set("rol")}
        />
      )}
    </FormModal>
  );
}
