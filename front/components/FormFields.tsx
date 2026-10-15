import { Children, useState, type ReactNode } from "react";
import { View, Text, TextInput, TouchableOpacity, type KeyboardTypeOptions } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../context/SettingsContext";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Texto fijo antes del valor, por ejemplo "$" */
  prefix?: string;
  /** Texto fijo después del valor, por ejemplo "%" */
  suffix?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Campo de contraseña (con botón para mostrar u ocultar) */
  secureTextEntry?: boolean;
  editable?: boolean;
};

/** Campo de texto con etiqueta, error y pista. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  error,
  hint,
  keyboardType,
  prefix,
  suffix,
  multiline,
  autoCapitalize,
  secureTextEntry,
  editable = true,
}: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const border = error ? "border-red-500" : focused ? "border-brand-400" : "border-slate-600";

  return (
    <View className="mb-4">
      <Text className="text-slate-300 text-sm font-semibold mb-1.5">
        {label}
        {required ? <Text className="text-wine-400"> *</Text> : null}
      </Text>
      <View className={`flex-row items-center bg-slate-900 border ${border} rounded-xl px-4`}>
        {prefix ? <Text className="text-slate-400 mr-2">{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && hidden}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-ink py-3"
          style={multiline ? { minHeight: 88, textAlignVertical: "top" } : undefined}
        />
        {suffix ? <Text className="text-slate-400 ml-2">{suffix}</Text> : null}
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setHidden(!hidden)} className="ml-2 p-1">
            {hidden ? <Eye color={theme.muted} size={20} /> : <EyeOff color={theme.muted} size={20} />}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text className="text-red-400 text-xs mt-1">{error}</Text>
      ) : hint ? (
        <Text className="text-slate-500 text-xs mt-1">{hint}</Text>
      ) : null}
    </View>
  );
}

/** Varios campos en la misma fila */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {Children.map(children, (child) => (
        <View style={{ flex: 1 }}>{child}</View>
      ))}
    </View>
  );
}

/** Título de un grupo de campos */
export function Section({ title }: { title: string }) {
  return (
    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2 mb-3">
      {title}
    </Text>
  );
}

type ChipSelectProps<V extends string | number | null> = {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
};

/** Elegir una opción entre pocas (categoría, tipo de cliente...) */
export function ChipSelect<V extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: ChipSelectProps<V>) {
  return (
    <View className="mb-4">
      <Text className="text-slate-300 text-sm font-semibold mb-1.5">{label}</Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <TouchableOpacity
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              className={`px-4 py-2 rounded-full border ${
                active ? "bg-brand-500 border-brand-400" : "bg-slate-900 border-slate-600"
              }`}
            >
              <Text className={active ? "text-white font-semibold" : "text-slate-300"}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
