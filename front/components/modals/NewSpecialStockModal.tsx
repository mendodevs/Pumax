import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";

export default function SpecialStockModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const [tipo, setTipo] = useState("Entrada");
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(new Date());
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoOpen, setMotivoOpen] = useState(false);

  // Se guardan las claves; el texto se traduce al mostrarlo
  const motivosEntrada = ["in.return", "in.adjust", "in.production", "in.transfer", "in.donation"];
  const motivosSalida = ["out.return", "out.adjust", "out.internal", "out.transfer", "out.donation"];

  const motivosDisponibles =
    tipo === "Entrada" ? motivosEntrada : motivosSalida;

  const handleRegistrar = () => {
    if (!producto || !cantidad || !motivo) {
      alert(t("special.required"));
      return;
    }

    const movimiento = {
      tipo,
      producto,
      cantidad: parseInt(cantidad),
      fecha: fecha.toISOString().split("T")[0],
      motivo,
    };

    alert(t("special.saved"));

    // Limpiar campos
    setProducto("");
    setCantidad("");
    setMotivo("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      {/* Fondo oscuro */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center" />
      </TouchableWithoutFeedback>

      {/* Contenedor del modal */}
      <View className="absolute inset-0 justify-center items-center px-4">
        <View className="bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-lg border border-slate-700">
          <ScrollView showsVerticalScrollIndicator={true}>
            <Text className="text-xl font-bold mb-6 text-ink text-center">
              {t("special.title")}
            </Text>

            {/* Tipo */}
            <Text className="text-ink mb-2 font-semibold">
              {t("special.type")}
            </Text>
            <View className="flex-row justify-between mb-4">
              <TouchableOpacity
                className={`flex-1 mr-2 p-3 rounded-xl ${
                  tipo === "Entrada" ? "bg-brand-500" : "bg-slate-700"
                }`}
                onPress={() => {
                  setTipo("Entrada");
                  setMotivo("");
                  setMotivoOpen(false);
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    tipo === "Entrada" ? "text-white" : "text-gray-400"
                  }`}
                >
                  {t("special.in")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 ml-2 p-3 rounded-xl ${
                  tipo === "Salida" ? "bg-brand-500" : "bg-slate-700"
                }`}
                onPress={() => {
                  setTipo("Salida");
                  setMotivo("");
                  setMotivoOpen(false);
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    tipo === "Salida" ? "text-white" : "text-gray-400"
                  }`}
                >
                  {t("special.out")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Producto */}
            <Text className="text-ink mb-2 font-semibold">{t("special.product")}</Text>
            <TextInput
              className="bg-slate-700 border border-gray-500 rounded-xl p-3 mb-4 text-base text-ink"
              placeholder={t("special.productPh")}
              placeholderTextColor={theme.placeholder}
              value={producto}
              onChangeText={setProducto}
            />

            {/* Cantidad */}
            <Text className="text-ink mb-2 font-semibold">{t("special.qty")}</Text>
            <TextInput
              className="bg-slate-700 border border-gray-500 rounded-xl p-3 mb-4 text-base text-ink"
              placeholder={t("special.qtyPh")}
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
              value={cantidad}
              onChangeText={setCantidad}
            />

            {/* Fecha */}
            <Text className="text-ink mb-2 font-semibold">{t("special.date")}</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                className="bg-slate-700 border border-gray-500 rounded-xl p-3 mb-4 text-base w-full text-ink"
                value={fecha.toISOString().split("T")[0]}
                onChange={(e) => setFecha(new Date(e.target.value))}
              />
            ) : (
              <>
                <TouchableOpacity
                  className="bg-slate-700 border border-gray-500 rounded-xl p-3 mb-4"
                  onPress={() => setMostrarFecha(true)}
                >
                  <Text className="text-ink text-center">
                    {fecha.toLocaleDateString(locale)}
                  </Text>
                </TouchableOpacity>
                {mostrarFecha && (
                  <DateTimePicker
                    value={fecha}
                    mode="date"
                    display="calendar"
                    onChange={(event, selectedDate) => {
                      setMostrarFecha(false);
                      if (selectedDate) setFecha(selectedDate);
                    }}
                  />
                )}
              </>
            )}

            {/* Motivo */}
            <Text className="text-ink mb-2 font-semibold">{t("special.reason")}</Text>
            <TouchableOpacity
              className="flex-row justify-between items-center bg-slate-700 rounded-xl p-3"
              onPress={() => setMotivoOpen(!motivoOpen)}
            >
              <Text className="text-base text-ink">{motivo ? t(`special.${motivo}`) : t("special.reasonPh")}</Text>
              <Text className="text-ink">{motivoOpen ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {motivoOpen && (
              <View className="mt-2 bg-slate-700 rounded-xl border border-slate-600">
                {motivosDisponibles.map((m) => (
                  <TouchableOpacity
                    key={m}
                    className="py-2 px-3 border-b border-slate-600"
                    onPress={() => {
                      setMotivo(m);
                      setMotivoOpen(false);
                    }}
                  >
                    <Text className="text-ink">{t(`special.${m}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Botones */}
            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={onClose}
                className=" mr-2 bg-brand-700 rounded-xl p-4"
              >
                <Text className="text-white text-center font-semibold">
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRegistrar}
                className=" ml-2 bg-brand-500 rounded-2xl p-4"
              >
                <Text className="text-white text-center font-semibold">
                  {t("special.submit")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
