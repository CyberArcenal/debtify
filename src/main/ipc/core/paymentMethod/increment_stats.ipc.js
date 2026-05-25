// src/main/ipc/paymentMethod/increment_stats.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { methodId, amount } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post(`/api/v1/payment-methods/${methodId}/increment-stats`, { amount });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    return { status: true, message: "Payment method stats updated on server", data: null };
  } else {
    await paymentMethodService.incrementPaymentMethodStats(methodId, amount, queryRunner);
    return { status: true, message: "Payment method stats updated locally", data: null };
  }
};