// src/main/ipc/paymentMethod/get/by_id.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/payment-methods/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Payment method retrieved from server", data: result };
  } else {
    const result = await paymentMethodService.getPaymentMethodById(id);
    return { status: true, message: "Payment method retrieved locally", data: result };
  }
};