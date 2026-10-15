import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react-native";
import FormModal from "../FormModal";
import { ChipSelect, Field, FieldRow, Section } from "../FormFields";
import { useFormState } from "../../hooks/useFormState";
import { createUser, type Rol } from "../../services/users.service";
import { useI18n } from "../../i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** `passwordTemporal` viene cuando el servidor generó la contraseña */
  onCreated: (result: { username: string; passwordTemporal?: string }) => void;
};

export const ROLES: Rol[] = ["VENDEDOR", "DEPOSITO", "FACTURACION", "VIAJANTE", "ADMIN"];

const INITIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  cargo: "",
  email: "",
  telefono: "",
  username: "",
  password: "",
  rol: "VENDEDOR",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9._-]{3,50}$/;

/** "María José" -> "mariajose" */
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Propuesta de usuario: nombre.apellido */
const suggest = (nombre: string, apellido: string) => {
  const n = slug(nombre.trim().split(/\s+/)[0] || "");
  const a = slug(apellido.trim().split(/\s+/)[0] || "");
  return n && a ? `${n}.${a}` : n || a;
};

export default function NewUserModal({ visible, onClose, onCreated }: Props) {
  const { t } = useI18n();
  const { values, errors, setErrors, set, submitting, serverError, submit } = useFormState(INITIAL, visible);
  // Mientras la persona no toque el campo Usuario, se completa solo con nombre.apellido
  const [userTouched, setUserTouched] = useState(false);

  useEffect(() => {
    if (visible) setUserTouched(false);
  }, [visible]);

  const onName = (key: "nombre" | "apellido") => (text: string) => {
    set(key)(text);
    if (!userTouched) {
      const next = { ...values, [key]: text };
      set("username")(suggest(next.nombre, next.apellido));
    }
  };

  const handleSave = () => {
    const found: typeof errors = {};
    if (!values.nombre.trim()) found.nombre = t("users.err.firstName");
    if (!values.apellido.trim()) found.apellido = t("users.err.lastName");
    if (!/^\d{6,12}$/.test(values.dni.replace(/[.\s-]/g, ""))) found.dni = t("users.err.dni");
    if (values.email.trim() && !EMAIL.test(values.email.trim())) found.email = t("users.err.email");
    if (!USERNAME.test(values.username.trim())) found.username = t("users.err.username");
    if (values.password && values.password.length < 8) found.password = t("users.err.password");

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    submit(async () => {
      const result = await createUser({
        username: values.username.trim(),
        rol: values.rol as Rol,
        password: values.password || undefined,
        empleado: {
          nombre: values.nombre.trim(),
          apellido: values.apellido.trim(),
          dni: values.dni.trim(),
          cargo: values.cargo.trim() || undefined,
          email: values.email.trim() || undefined,
          telefono: values.telefono.trim() || undefined,
        },
      });
      onCreated({ username: result.user.username, passwordTemporal: result.passwordTemporal });
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("users.new.title")}
      subtitle={t("users.new.subtitle")}
      icon={UserPlus}
      submitText={t("users.new.submit")}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Section title={t("users.section.person")} />
      <FieldRow>
        <Field
          label={t("users.field.firstName")}
          required
          value={values.nombre}
          onChangeText={onName("nombre")}
          autoCapitalize="words"
          error={errors.nombre}
        />
        <Field
          label={t("users.field.lastName")}
          required
          value={values.apellido}
          onChangeText={onName("apellido")}
          autoCapitalize="words"
          error={errors.apellido}
        />
      </FieldRow>
      <FieldRow>
        <Field
          label={t("users.field.dni")}
          required
          value={values.dni}
          onChangeText={set("dni")}
          keyboardType="number-pad"
          placeholder="12345678"
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
      <Field
        label={t("users.field.username")}
        required
        value={values.username}
        onChangeText={(text) => {
          setUserTouched(true);
          set("username")(text);
        }}
        autoCapitalize="none"
        hint={t("users.hint.username")}
        error={errors.username}
      />
      <Field
        label={t("users.field.password")}
        value={values.password}
        onChangeText={set("password")}
        secureTextEntry
        autoCapitalize="none"
        hint={t("users.hint.password")}
        error={errors.password}
      />
      <ChipSelect
        label={t("users.field.role")}
        options={ROLES.map((r) => ({ value: r as string, label: t(`account.role.${r}`) }))}
        value={values.rol}
        onChange={set("rol")}
      />
    </FormModal>
  );
}
