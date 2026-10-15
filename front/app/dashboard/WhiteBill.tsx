import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Minus,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { useProducts } from "../../hooks/useProducts";
import { useClients } from "../../hooks/useClients";
import { useAuth } from "../../hooks/useAuth";
import {
  createLegalInvoice,
  downloadInvoicePDF,
} from "../../services/billing.service";
import SelectClientModal from "../../components/modals/SelectClientModal";
import { colors } from "../../constants/theme";
import { useI18n } from "../../i18n";
import { useTheme } from "../../context/SettingsContext";
import { money } from "../../utils/format";

type CartItem = {
  id: number;
  name: string;
  code: string;
  price: number;
  stock: number;
  quantity: number;
};

type CreatedInvoice = { id: number; numero_factura: string | number };
type Notice = { kind: "error" | "info" | "success"; text: string };

/** Número de sección dentro de una tarjeta */
function StepBadge({ n }: { n: number }) {
  return (
    <View className="w-7 h-7 rounded-full bg-brand-500 items-center justify-center mr-3">
      <Text className="text-white font-bold text-sm">{n}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4">
      {children}
    </View>
  );
}

export default function WhiteBill() {
  const { t, tn } = useI18n();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [client, setClient] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<CreatedInvoice | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    products: productsData,
    loading: loadingProducts,
    error: errorProducts,
    refetch: refetchProducts,
  } = useProducts();
  const {
    clients: clientsData,
    loading: loadingClients,
    error: errorClients,
  } = useClients();
  const { user } = useAuth();

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  /** Aviso dentro de la pantalla (Alert.alert no se muestra en la versión web) */
  const showNotice = (kind: Notice["kind"], text: string) => {
    setNotice({ kind, text });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  // Mapear productos y filtrar por búsqueda
  const products = productsData.map((p) => ({
    id: p.id,
    name: p.descripcion,
    code: p.codigo,
    price: p.precio_venta,
    stock: p.stock,
  }));

  const filteredProducts = products
    .filter(
      (p) =>
        productSearch &&
        (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.code.toLowerCase().includes(productSearch.toLowerCase()))
    )
    .slice(0, 10); // Solo mostrar los primeros 10 resultados

  // Mapear clientes con todos los datos necesarios para el modal
  const clients = clientsData.map((c) => ({
    id: c.id,
    name: c.nombre,
    cuit: c.cuit || undefined,
    razon_social: c.razon_social || undefined,
  }));

  const selectedClient = clients.find((c) => c.id.toString() === client);

  const addProduct = (product: Omit<CartItem, "quantity">) => {
    const exists = selectedProducts.find((p) => p.id === product.id);
    if (exists) {
      showNotice("info", t("billing.notice.alreadyInList"));
      return;
    }
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    setProductSearch(""); // Limpiar búsqueda
  };

  const removeProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: number, newQty: string) => {
    const qty = parseInt(newQty) || 1;
    const product = products.find((p) => p.id === id);
    if (product && qty > product.stock) {
      showNotice("error", t("billing.notice.stockAvailable", { n: product.stock }));
      return;
    }
    if (qty <= 0) {
      removeProduct(id);
      return;
    }
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, quantity: qty } : p))
    );
  };

  const total = selectedProducts.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const totalUnits = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
  const canGenerate = !isCreatingInvoice && selectedProducts.length > 0 && !!client;

  const handleDownloadPDF = async () => {
    if (!lastCreatedInvoice) return;

    setIsDownloadingPDF(true);
    try {
      await downloadInvoicePDF(
        lastCreatedInvoice.id,
        String(lastCreatedInvoice.numero_factura)
      );
      showNotice("success", t("billing.notice.pdfOk"));
    } catch (error) {
      showNotice("error", t("billing.notice.pdfFail"));
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const generateInvoice = async () => {
    if (!client) {
      showNotice("error", t("billing.notice.selectClient"));
      return;
    }
    if (selectedProducts.length === 0) {
      showNotice("error", t("billing.notice.addProducts"));
      return;
    }

    setIsCreatingInvoice(true);

    try {
      const invoiceData = {
        pedido_id: null,
        cliente_id: parseInt(client),
        tipo_factura: "B" as const,
        usuario_emision_id: user?.id || null,
        items: selectedProducts.map((p) => ({
          producto_id: p.id,
          cantidad: p.quantity,
          precio_unitario: p.price,
          subtotal: p.price * p.quantity,
        })),
      };

      const invoice = await createLegalInvoice(invoiceData);

      // Guardar la factura creada para poder descargar el PDF
      setLastCreatedInvoice(invoice);

      // Mostrar mensaje de éxito
      setSuccessMessage(
        t("billing.notice.created", { num: invoice.numero_factura, total: money(total) })
      );

      // Limpiar formulario
      setSelectedProducts([]);
      setClient("");
      setProductSearch("");

      // Recargar productos para actualizar el stock (en background)
      refetchProducts();

      // Ocultar mensaje después de 10 segundos
      setTimeout(() => {
        setSuccessMessage("");
        setLastCreatedInvoice(null);
      }, 10000);
    } catch (error) {
      showNotice("error", t("billing.notice.createFail"));
      console.error("Error creating invoice:", error);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Loading state
  if (loadingProducts || loadingClients) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brandLight} />
        <Text className="text-ink mt-4">{t("billing.loading")}</Text>
      </View>
    );
  }

  // Error state
  if (errorProducts || errorClients) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-4">
        <AlertTriangle color={colors.danger} size={48} />
        <Text className="text-ink text-lg mt-4 text-center">
          {errorProducts || errorClients}
        </Text>
      </View>
    );
  }

  // Botón principal (se usa en el resumen de escritorio y en el pie de móvil)
  const generateButton = (
    <TouchableOpacity
      onPress={generateInvoice}
      disabled={!canGenerate}
      className={`py-4 rounded-xl flex-row items-center justify-center ${
        canGenerate ? "bg-brand-500 active:bg-brand-700" : "bg-slate-600"
      }`}
    >
      {isCreatingInvoice ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Receipt color={canGenerate ? "#fff" : colors.muted} size={20} />
          <Text
            className={`font-bold text-base ml-2 ${
              canGenerate ? "text-white" : "text-slate-400"
            }`}
          >
            {t("billing.generate")}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  const summary = (
    <View className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <View className="h-1 bg-wine-600" />
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-ink font-bold text-lg">{t("billing.summary")}</Text>
          <View className="bg-wine-600/20 border border-wine-600 rounded-full px-3 py-1">
            <Text className="text-wine-400 text-xs font-bold">{t("billing.invoiceB")}</Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-slate-400">{t("billing.client")}</Text>
          <Text className="text-ink flex-1 text-right ml-4" numberOfLines={1}>
            {selectedClient?.name ?? "—"}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-slate-400">{t("billing.products")}</Text>
          <Text className="text-ink">{selectedProducts.length}</Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="text-slate-400">{t("billing.units")}</Text>
          <Text className="text-ink">{totalUnits}</Text>
        </View>

        <View className="border-t border-slate-700 pt-4 mb-5 flex-row items-end justify-between">
          <Text className="text-slate-300">{t("billing.total")}</Text>
          <Text className="text-brand-400 text-3xl font-bold">${money(total)}</Text>
        </View>

        {generateButton}

        {!canGenerate && !isCreatingInvoice && (
          <Text className="text-slate-400 text-xs text-center mt-3">
            {!client ? t("billing.hint.client") : t("billing.hint.products")}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: isMobile ? 72 : 24,
          paddingBottom: 32,
        }}
      >
        <View style={{ width: "100%", maxWidth: 1100, alignSelf: "center" }}>
          {/* Encabezado */}
          <View className="flex-row items-center mb-5">
            <View className="w-11 h-11 rounded-xl bg-brand-700 items-center justify-center mr-3">
              <Receipt color={colors.wineLight} size={22} />
            </View>
            <View>
              <Text className="text-2xl font-bold text-ink">{t("billing.title")}</Text>
              <Text className="text-slate-400 text-sm">{t("billing.subtitle")}</Text>
            </View>
          </View>

          {/* Avisos */}
          {successMessage ? (
            <View className="bg-brand-700 border border-brand-500 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-brand-500 items-center justify-center mr-3">
                  <Check color="#fff" size={18} />
                </View>
                <Text className="text-white font-semibold flex-1">{successMessage}</Text>
              </View>
              {lastCreatedInvoice && (
                <TouchableOpacity
                  onPress={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="mt-3 bg-white py-2.5 px-4 rounded-xl flex-row items-center justify-center"
                >
                  {isDownloadingPDF ? (
                    <ActivityIndicator color={colors.brand} />
                  ) : (
                    <>
                      <Download color={colors.brand} size={20} />
                      <Text className="text-brand-600 font-bold ml-2">{t("billing.downloadPdf")}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {notice ? (
            <View
              className={`rounded-xl px-4 py-3 mb-4 border ${
                notice.kind === "error"
                  ? "bg-red-500/20 border-red-500"
                  : notice.kind === "success"
                  ? "bg-brand-700 border-brand-500"
                  : "bg-slate-700 border-slate-500"
              }`}
            >
              <Text className="text-white">{notice.text}</Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: isMobile ? "column" : "row",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            {/* Columna principal */}
            <View style={{ flex: 1, width: "100%" }}>
              {/* 1. Cliente */}
              <Card>
                <View className="flex-row items-center mb-4">
                  <StepBadge n={1} />
                  <Text className="text-ink font-semibold text-base">{t("billing.client")}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setClientModalVisible(true)}
                  className={`flex-row items-center justify-between rounded-xl px-4 py-3 border ${
                    selectedClient
                      ? "bg-slate-900 border-brand-500"
                      : "bg-slate-900 border-dashed border-slate-500"
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={selectedClient ? "text-ink font-semibold" : "text-slate-400"}
                    >
                      {selectedClient ? selectedClient.name : t("billing.selectClient")}
                    </Text>
                    {selectedClient && (selectedClient.cuit || selectedClient.razon_social) ? (
                      <Text className="text-slate-400 text-xs mt-1">
                        {[selectedClient.razon_social, selectedClient.cuit && `CUIT ${selectedClient.cuit}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronDown color={colors.muted} size={20} />
                </TouchableOpacity>

                {clients.length > 0 && (
                  <>
                    <Text className="text-slate-400 text-xs mt-4 mb-2">{t("billing.quickAccess")}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {clients.slice(0, 10).map((c) => {
                        const active = client === c.id.toString();
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => setClient(c.id.toString())}
                            className={`px-4 py-2 mr-2 rounded-full border ${
                              active
                                ? "bg-brand-500 border-brand-400"
                                : "bg-slate-700 border-slate-600"
                            }`}
                          >
                            <Text className="text-white text-sm">{c.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}
              </Card>

              {/* 2. Productos */}
              <Card>
                <View className="flex-row items-center mb-4">
                  <StepBadge n={2} />
                  <Text className="text-ink font-semibold text-base">{t("billing.addProducts")}</Text>
                </View>

                <View className="flex-row items-center bg-slate-900 rounded-xl border border-slate-600 px-3 py-2">
                  <Search color={colors.muted} size={20} />
                  <TextInput
                    value={productSearch}
                    onChangeText={setProductSearch}
                    placeholder={t("billing.searchPlaceholder")}
                    placeholderTextColor={theme.placeholder}
                    className="flex-1 ml-2 text-ink py-1"
                  />
                  {productSearch ? (
                    <TouchableOpacity onPress={() => setProductSearch("")}>
                      <X color={colors.muted} size={20} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {productSearch && filteredProducts.length === 0 && (
                  <Text className="text-slate-400 text-center py-4">
                    {t("billing.noProductsFound")}
                  </Text>
                )}

                {filteredProducts.length > 0 && (
                  <View className="mt-3 bg-slate-900 rounded-xl border border-slate-700 max-h-72 overflow-hidden">
                    <ScrollView>
                      {filteredProducts.map((product, i) => (
                        <TouchableOpacity
                          key={product.id}
                          onPress={() => addProduct(product)}
                          disabled={product.stock <= 0}
                          className={`px-4 py-3 flex-row items-center ${
                            i > 0 ? "border-t border-slate-700" : ""
                          } ${product.stock <= 0 ? "opacity-40" : ""}`}
                        >
                          <View className="flex-1 pr-3">
                            <Text className="text-ink font-semibold">{product.name}</Text>
                            <Text className="text-slate-400 text-xs mt-1">
                              {product.code} ·{" "}
                              <Text className={product.stock <= 5 ? "text-amber-400" : ""}>
                                {t("billing.stock", { n: product.stock })}
                              </Text>
                            </Text>
                          </View>
                          <Text className="text-brand-400 font-bold mr-3">
                            ${money(Number(product.price))}
                          </Text>
                          <View className="w-8 h-8 rounded-full bg-brand-500 items-center justify-center">
                            <Plus color="#fff" size={18} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </Card>

              {/* 3. Detalle */}
              <Card>
                <View className="flex-row items-center mb-4">
                  <StepBadge n={3} />
                  <Text className="text-ink font-semibold text-base flex-1">{t("billing.detail")}</Text>
                  <Text className="text-slate-400 text-sm">
                    {tn("billing.itemCount", selectedProducts.length)}
                  </Text>
                </View>

                {selectedProducts.length === 0 ? (
                  <View className="border border-dashed border-slate-600 rounded-xl py-8 items-center">
                    <Receipt color={colors.muted} size={28} />
                    <Text className="text-slate-400 mt-2">{t("billing.emptyDetail")}</Text>
                  </View>
                ) : (
                  selectedProducts.map((item, i) => (
                    <View
                      key={item.id}
                      className={`py-3 ${i > 0 ? "border-t border-slate-700" : ""}`}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-ink font-semibold">{item.name}</Text>
                          <Text className="text-slate-400 text-xs mt-1">
                            {t("billing.line", { code: item.code, price: money(Number(item.price)) })}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeProduct(item.id)}
                          className="p-2 rounded-lg bg-red-600/20"
                        >
                          <Trash2 color={colors.danger} size={16} />
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row items-center justify-between mt-3">
                        {/* Selector de cantidad */}
                        <View className="flex-row items-center bg-slate-900 rounded-xl border border-slate-600">
                          <TouchableOpacity
                            onPress={() => updateQuantity(item.id, String(item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className={`w-10 h-10 items-center justify-center ${
                              item.quantity <= 1 ? "opacity-30" : ""
                            }`}
                          >
                            <Minus color="#fff" size={16} />
                          </TouchableOpacity>
                          <TextInput
                            value={item.quantity.toString()}
                            onChangeText={(text) => updateQuantity(item.id, text)}
                            keyboardType="numeric"
                            className="text-ink w-12 text-center font-semibold"
                          />
                          <TouchableOpacity
                            onPress={() => updateQuantity(item.id, String(item.quantity + 1))}
                            className="w-10 h-10 items-center justify-center"
                          >
                            <Plus color="#fff" size={16} />
                          </TouchableOpacity>
                        </View>

                        <Text className="text-ink font-bold text-lg">
                          ${money(item.price * item.quantity)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </Card>
            </View>

            {/* Resumen lateral (solo en pantallas anchas) */}
            {!isMobile && <View style={{ width: 340 }}>{summary}</View>}
          </View>
        </View>
      </ScrollView>

      {/* Pie fijo en móvil */}
      {isMobile && (
        <View className="bg-slate-800 border-t border-slate-700 px-4 py-4">
          <View className="flex-row justify-between items-end mb-3">
            <Text className="text-slate-300">
              {tn("billing.footerTotal", totalUnits)}
            </Text>
            <Text className="text-brand-400 text-2xl font-bold">${money(total)}</Text>
          </View>
          {generateButton}
        </View>
      )}

      {/* Modal de selección de clientes */}
      <SelectClientModal
        visible={clientModalVisible}
        clients={clients}
        selectedClientId={client}
        onClose={() => setClientModalVisible(false)}
        onSelect={(clientId) => setClient(clientId.toString())}
      />
    </View>
  );
}
