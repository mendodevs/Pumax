import { Lamp } from "lucide-react-native";
import FormModal from "../FormModal";
import { ChipSelect, Field, FieldRow, Section } from "../FormFields";
import { useFormState, toNumber } from "../../hooks/useFormState";
import { useCategories } from "../../hooks/useCategories";
import { createProduct } from "../../services/products.service";
import { useI18n } from "../../i18n";

type Props = { visible: boolean; onClose: () => void; onSuccess: () => void };

const INITIAL = {
  codigo: "",
  descripcion: "",
  categoria_id: "", // vacío = sin categoría
  precio_base: "",
  margen_ganancia: "20",
  precio_venta: "",
  stock: "0",
  stock_minimo: "10",
};

const round2 = (n: number) => String(Math.round(n * 100) / 100);

export default function NewProductModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { categories } = useCategories();
  const { values, setValues, errors, setErrors, set, submitting, serverError, submit } =
    useFormState(INITIAL, visible);

  const categoryOptions = [
    { value: "", label: t("forms.product.noCategory") },
    ...categories.map((c) => ({ value: String(c.id), label: c.nombre })),
  ];

  // Precio base o margen -> se recalcula el precio de venta
  const onBaseOrMargin = (field: "precio_base" | "margen_ganancia") => (text: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: text };
      const base = toNumber(next.precio_base);
      const margen = toNumber(next.margen_ganancia);
      if (!Number.isNaN(base) && base > 0 && !Number.isNaN(margen)) {
        next.precio_venta = round2(base * (1 + margen / 100));
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined, precio_venta: undefined }));
  };

  // Precio de venta escrito a mano -> se recalcula el margen
  const onSalePrice = (text: string) => {
    setValues((prev) => {
      const next = { ...prev, precio_venta: text };
      const base = toNumber(prev.precio_base);
      const venta = toNumber(text);
      if (!Number.isNaN(base) && base > 0 && !Number.isNaN(venta)) {
        next.margen_ganancia = round2((venta / base - 1) * 100);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, precio_venta: undefined }));
  };

  const handleSave = () => {
    const found: typeof errors = {};
    const base = toNumber(values.precio_base);
    const venta = toNumber(values.precio_venta);
    const margen = toNumber(values.margen_ganancia || "0");
    const stock = toNumber(values.stock || "0");
    const minimo = toNumber(values.stock_minimo || "0");

    if (!values.codigo.trim()) found.codigo = t("forms.product.errCode");
    if (!values.descripcion.trim()) found.descripcion = t("forms.product.errName");
    if (Number.isNaN(base) || base < 0) found.precio_base = t("forms.product.errCost");
    if (Number.isNaN(venta) || venta <= 0) found.precio_venta = t("forms.product.errSale");
    if (Number.isNaN(margen)) found.margen_ganancia = t("forms.product.errNumber");
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock))
      found.stock = t("forms.product.errInteger");
    if (Number.isNaN(minimo) || minimo < 0 || !Number.isInteger(minimo))
      found.stock_minimo = t("forms.product.errInteger");

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    submit(async () => {
      await createProduct({
        codigo: values.codigo.trim(),
        descripcion: values.descripcion.trim(),
        categoria_id: values.categoria_id ? Number(values.categoria_id) : null,
        precio_base: base,
        precio_venta: venta,
        margen_ganancia: margen,
        stock,
        stock_minimo: minimo,
        activo: true,
      });
      onSuccess();
      onClose();
    });
  };

  return (
    <FormModal
      visible={visible}
      title={t("forms.product.title")}
      subtitle={t("forms.product.subtitle")}
      icon={Lamp}
      submitText={t("forms.product.submit")}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <FieldRow>
        <Field
          label={t("forms.field.code")}
          required
          value={values.codigo}
          onChangeText={set("codigo")}
          placeholder={t("forms.product.codePh")}
          autoCapitalize="characters"
          error={errors.codigo}
        />
        <Field
          label={t("forms.field.name")}
          required
          value={values.descripcion}
          onChangeText={set("descripcion")}
          placeholder={t("forms.product.namePh")}
          error={errors.descripcion}
        />
      </FieldRow>

      <ChipSelect
        label={t("forms.product.category")}
        options={categoryOptions}
        value={values.categoria_id}
        onChange={set("categoria_id")}
      />

      <Section title={t("forms.product.sectionPrices")} />
      <FieldRow>
        <Field
          label={t("forms.product.cost")}
          required
          value={values.precio_base}
          onChangeText={onBaseOrMargin("precio_base")}
          keyboardType="decimal-pad"
          prefix="$"
          error={errors.precio_base}
        />
        <Field
          label={t("forms.product.margin")}
          value={values.margen_ganancia}
          onChangeText={onBaseOrMargin("margen_ganancia")}
          keyboardType="decimal-pad"
          suffix="%"
          error={errors.margen_ganancia}
        />
      </FieldRow>
      <Field
        label={t("forms.product.salePrice")}
        required
        value={values.precio_venta}
        onChangeText={onSalePrice}
        keyboardType="decimal-pad"
        prefix="$"
        hint={t("forms.product.salePriceHint")}
        error={errors.precio_venta}
      />

      <Section title={t("forms.product.sectionStock")} />
      <FieldRow>
        <Field
          label={t("forms.product.initialStock")}
          value={values.stock}
          onChangeText={set("stock")}
          keyboardType="number-pad"
          error={errors.stock}
        />
        <Field
          label={t("forms.product.minStock")}
          value={values.stock_minimo}
          onChangeText={set("stock_minimo")}
          keyboardType="number-pad"
          hint={t("forms.product.minStockHint")}
          error={errors.stock_minimo}
        />
      </FieldRow>
    </FormModal>
  );
}
