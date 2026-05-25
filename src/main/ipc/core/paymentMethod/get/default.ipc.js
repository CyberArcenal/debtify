// src/main/ipc/paymentMethod/get/default.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/payment-methods/default");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const defaultMethod = await response.json();
    return { status: true, message: "Default payment method retrieved from server", data: defaultMethod };
  } else {
    const defaultMethod = await paymentMethodService.getDefaultPaymentMethod();
    return { status: true, message: "Default payment method retrieved locally", data: defaultMethod };
  }
};