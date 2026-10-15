import { Users } from "lucide-react-native";
import FormModal from "../FormModal";
import { ChipSelect, Field, FieldRow, Section } from "../FormFields";
import { useFormState, toNumber } from "../../hooks/useFormState";
import { createClient } from "../../services/clients.service";
import { useI18n } from "../../i18n";
import type { CondicionIVA, TipoCliente } from "../../types/clients.types";

type Props = { visible: boolean; onClose: () => void; onSuccess: () => void };

const INITIAL = {
  nombre: "",
  razon_social: "",
  cuit: "",
  telefono: "",
  email: "",
  direccion: "",
  localidad: "",
  provincia: "",
  tipo_cliente: "MINORISTA",
  condicion_iva: "CONSUMIDOR_FINAL",
  descuento_habitual: "0",
  limite_credito: "0",
};

// La etiqueta es la clave del diccionario; se traduce al renderizar
const TIPOS: { value: TipoCliente; label: string }[] = [
  { value: "MINORISTA", label: "forms.client.retail" },
  { value: "MAYORISTA", label: "forms.client.wholesale" },
];

const IVA: { value: CondicionIVA; label: string }[] = [
  { value: "CONSUMIDOR_FINAL", label: "forms.client.vatFinal" },
  { value: "MONOTRIBUTO", label: "forms.client.vatMono" },
  { value: "RI", label: "forms.client.vatRI" },
  { value: "EXENTO", label: "forms.client.vatExempt" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewClientModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { values, errors, setErrors, set, submitting, serverError, submit } = useFormState(
    INITIAL,
    visible
  );

  const handleSave = () => {
    const found: typeof errors = {};
    if (!values.nombre.trim()) found.nombre = t("forms.client.errName");
    if (values.cuit.trim() && values.cuit.replace(/\D/g, "").length !== 11)
      found.cuit = t("forms.err.cuit");
    if (values.email.trim() && !EMAIL.test(values.email.trim()))
      found.email = t("forms.err.email");

    const descuento = toNumber(values.descuento_habitual || "0");
    const limite = toNumber(values.limite_credito || "0");
    if (Number.isNaN(descuento) || descuento < 0 || descuento > 100)
      found.descuento_habitual = t("forms.client.errDiscount");
    if (Number.isNaN(limite) || limite < 0) found.limite_credito = t("forms.client.errCredit");

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const opt = (v: string) => v.trim() || undefined;
    submit(async () => {
      await createClient({
        nombre: values.nombre.trim(),
        razon_social: opt(values.razon_social),
        cuit: opt(values.cuit),
        telefono: opt(values.telefono),
        email: opt(values.email),
        direccion: opt(values.direccion),
        localidad: opt(values.localidad),
        provincia: opt(values.provincia),
        tipo_cliente: values.tipo_cliente as TipoCliente,
        condicion_iva: values.condicion_iva as CondicionIVA,
        descuento_habitual: descuento,
        limite_credito: limite,
        activo: true,
      });
      onSuccess();
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("forms.client.title")}
      subtitle={t("forms.client.subtitle")}
      icon={Users}
      submitText={t("forms.client.submit")}
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
        placeholder={t("forms.client.namePh")}
        error={errors.nombre}
      />
      <FieldRow>
        <Field label={t("forms.field.legalName")} value={values.razon_social} onChangeText={set("razon_social")} />
        <Field
          label={t("forms.field.cuit")}
          value={values.cuit}
          onChangeText={set("cuit")}
          placeholder="20-12345678-9"
          keyboardType="numbers-and-punctuation"
          error={errors.cuit}
        />
      </FieldRow>

      <Section title={t("forms.section.contact")} />
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
      <FieldRow>
        <Field label={t("forms.field.city")} value={values.localidad} onChangeText={set("localidad")} />
        <Field label={t("forms.field.province")} value={values.provincia} onChangeText={set("provincia")} />
      </FieldRow>

      <Section title={t("forms.client.sectionTerms")} />
      <ChipSelect
        label={t("forms.client.type")}
        options={TIPOS.map((o) => ({ ...o, label: t(o.label) }))}
        value={values.tipo_cliente as TipoCliente}
        onChange={set("tipo_cliente")}
      />
      <ChipSelect
        label={t("forms.client.vat")}
        options={IVA.map((o) => ({ ...o, label: t(o.label) }))}
        value={values.condicion_iva as CondicionIVA}
        onChange={set("condicion_iva")}
      />
      <FieldRow>
        <Field
          label={t("forms.client.discount")}
          value={values.descuento_habitual}
          onChangeText={set("descuento_habitual")}
          keyboardType="decimal-pad"
          suffix="%"
          error={errors.descuento_habitual}
        />
        <Field
          label={t("forms.client.creditLimit")}
          value={values.limite_credito}
          onChangeText={set("limite_credito")}
          keyboardType="decimal-pad"
          prefix="$"
          error={errors.limite_credito}
        />
      </FieldRow>
    </FormModal>
  );
}
