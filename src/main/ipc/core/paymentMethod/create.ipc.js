// src/main/ipc/paymentMethod/create.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post("/api/v1/payment-methods", data);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Payment method created on server", data: result };
  } else {
    const result = await paymentMethodService.createPaymentMethod(data, user, queryRunner);
    return { status: true, message: "Payment method created locally", data: result };
  }
};