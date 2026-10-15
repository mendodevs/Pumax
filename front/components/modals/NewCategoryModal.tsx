import { Blocks } from "lucide-react-native";
import FormModal from "../FormModal";
import { Field } from "../FormFields";
import { useFormState } from "../../hooks/useFormState";
import { createCategory } from "../../services/categories.service";
import { useI18n } from "../../i18n";

type Props = { visible: boolean; onClose: () => void; onSuccess: () => void };

const INITIAL = { nombre: "", descripcion: "" };

export default function NewCategoryModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { values, errors, setErrors, set, submitting, serverError, submit } = useFormState(
    INITIAL,
    visible
  );

  const handleSave = () => {
    if (!values.nombre.trim()) {
      setErrors({ nombre: t("forms.category.errName") });
      return;
    }
    submit(async () => {
      await createCategory({
        nombre: values.nombre.trim(),
        descripcion: values.descripcion.trim() || undefined,
        activo: true,
      });
      onSuccess();
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("forms.category.title")}
      subtitle={t("forms.category.subtitle")}
      icon={Blocks}
      submitText={t("forms.category.submit")}
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
        placeholder={t("forms.category.namePh")}
        error={errors.nombre}
      />
      <Field
        label={t("forms.field.description")}
        value={values.descripcion}
        onChangeText={set("descripcion")}
        placeholder={t("forms.category.descPh")}
        multiline
      />
    </FormModal>
  );
}
