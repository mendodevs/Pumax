import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";

export default function NewReport() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    const newReport = {
      title,
      description,
      date: date.toISOString().split("T")[0],
    };

    Alert.alert("Éxito", "El reporte fue enviado correctamente.");

    setTitle("");
    setDescription("");
    setDate(new Date());
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-slate-900 p-5"
    >
      <Text className="text-xl font-bold text-center text-ink mb-6">
        Añadir Reporte
      </Text>
      <Text className="text-base text-ink mb-2">Usuario</Text>
      <TextInput
        className="bg-slate-700 border border-gray-300 rounded-xl p-3 mb-4 text-base text-ink"
        placeholder="Acá debería seleccionar usuario"
      />
      <Text className="text-base text-ink mb-2">Título</Text>
      <TextInput
        className="bg-slate-700 border border-gray-300 rounded-xl p-3 mb-4 text-base text-ink"
        placeholder="Ej: Reporte semanal"
        value={title}
        onChangeText={setTitle}
      />

      <Text className="text-base text-ink mb-2">Detalle</Text>
      <TextInput
        className="bg-slate-700 border border-gray-300 rounded-xl p-3 mb-4 text-base h-32 text-top text-ink"
        placeholder="Describe el reporte..."
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text className="text-base text-ink mb-2">Fecha</Text>
      {Platform.OS === "web" ? (
        // 🌐 Web: usar input HTML nativo
        <input
          type="date"
          className="bg-slate-700 border border-gray-300 rounded-xl p-3 mb-6 text-base text-ink"
          value={date.toISOString().split("T")[0]}
          onChange={(e) => setDate(new Date(e.target.value))}
        />
      ) : (
        // 📱 Móvil: usar DateTimePicker
        <>
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-xl p-3 mb-6"
            onPress={() => setShowPicker(true)}
          >
            <Text className="text-base text-gray-800">
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              onChange={handleDateChange}
            />
          )}
        </>
      )}
      <View className="flex-row justify-center space-x-4">
        <TouchableOpacity
          className="bg-brand-500 rounded-xl p-4 items-center"
          onPress={() => {
            handleSubmit();
            router.push("/dashboard/Reports");
          }}
        >
          <Text className="text-white text-md font-semibold">
            Guardar Reporte
          </Text>
        </TouchableOpacity>

         <TouchableOpacity
          className="bg-brand-700 rounded-xl p-4 items-center"
          onPress={() => {
            router.push("/dashboard/Reports");
          }}
        >
          <Text className="text-white text-md font-semibold">
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
