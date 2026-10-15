import { Package } from "lucide-react-native";
import FormModal from "../FormModal";
import { Field, FieldRow, Section } from "../FormFields";
import { useFormState } from "../../hooks/useFormState";
import { createSupplier } from "../../services/suppliers.service";
import { useI18n } from "../../i18n";

type Props = { visible: boolean; onClose: () => void; onSuccess: () => void };

const INITIAL = {
  nombre: "",
  razon_social: "",
  cuit: "",
  contacto_nombre: "",
  telefono: "",
  email: "",
  direccion: "",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewSupplierModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { values, errors, setErrors, set, submitting, serverError, submit } = useFormState(
    INITIAL,
    visible
  );

  const handleSave = () => {
    const found: typeof errors = {};
    if (!values.nombre.trim()) found.nombre = t("forms.supplier.errName");
    if (values.cuit.trim() && values.cuit.replace(/\D/g, "").length !== 11)
      found.cuit = t("forms.err.cuit");
    if (values.email.trim() && !EMAIL.test(values.email.trim()))
      found.email = t("forms.err.email");
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const opt = (v: string) => v.trim() || undefined;
    submit(async () => {
      await createSupplier({
        nombre: values.nombre.trim(),
        razon_social: opt(values.razon_social),
        cuit: opt(values.cuit),
        contacto_nombre: opt(values.contacto_nombre),
        telefono: opt(values.telefono),
        email: opt(values.email),
        direccion: opt(values.direccion),
        activo: true,
      });
      onSuccess();
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("forms.supplier.title")}
      subtitle={t("forms.supplier.subtitle")}
      icon={Package}
      submitText={t("forms.supplier.submit")}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field
        label={t("forms.field.name")}
        required
        value={values.nombre}
        onChangeText={set("nombre")}
        placeholder={t("forms.supplier.namePh")}
        error={errors.nombre}
      />
      <FieldRow>
        <Field label={t("forms.field.legalName")} value={values.razon_social} onChangeText={set("razon_social")} />
        <Field
          label={t("forms.field.cuit")}
          value={values.cuit}
          onChangeText={set("cuit")}
          placeholder="30-12345678-9"
          keyboardType="numbers-and-punctuation"
          error={errors.cuit}
        />
      </FieldRow>

      <Section title={t("forms.section.contact")} />
      <Field
        label={t("forms.field.contactPerson")}
        value={values.contacto_nombre}
        onChangeText={set("contacto_nombre")}
      />
      <FieldRow>
        <Field
          label={t("forms.field.phone")}
          value={values.telefono}
          onChangeText={set("telefono")}
          keyboardType="phone-pad"
        />
        <Field
          label={t("forms.field.email")}
          value={values.email}
          onChangeText={set("email")}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
      </FieldRow>
      <Field label={t("forms.field.address")} value={values.direccion} onChangeText={set("direccion")} />
    </FormModal>
  );
}
