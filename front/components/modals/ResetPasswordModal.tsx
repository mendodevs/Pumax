import { KeyRound } from "lucide-react-native";
import FormModal from "../FormModal";
import { Field } from "../FormFields";
import { useFormState } from "../../hooks/useFormState";
import { resetUserPassword, type User } from "../../services/users.service";
import { useI18n } from "../../i18n";

type Props = {
  visible: boolean;
  user: User | null;
  name: string;
  onClose: () => void;
  /** `passwordTemporal` viene cuando el servidor generó la contraseña */
  onDone: (result: { username: string; passwordTemporal?: string }) => void;
};

const INITIAL = { password: "" };

export default function ResetPasswordModal({ visible, user, name, onClose, onDone }: Props) {
  const { t } = useI18n();
  const { values, errors, setErrors, set, submitting, serverError, submit } = useFormState(INITIAL, visible);

  if (!user) return null;

  const handleSave = () => {
    if (values.password && values.password.length < 8) {
      setErrors({ password: t("users.err.password") });
      return;
    }
    submit(async () => {
      const { passwordTemporal } = await resetUserPassword(user.id, values.password || undefined);
      onDone({ username: user.username, passwordTemporal });
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("users.reset.title")}
      subtitle={t("users.reset.subtitle", { name })}
      icon={KeyRound}
      submitText={t("users.reset.submit")}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field
        label={t("users.reset.label")}
        value={values.password}
        onChangeText={set("password")}
        secureTextEntry
        autoCapitalize="none"
        hint={t("users.reset.hint")}
        error={errors.password}
      />
    </FormModal>
  );
}
