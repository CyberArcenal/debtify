// src/main/ipc/core/paymenttransaction/get/by_id.ipc.js
const paymentTransactionService = require("../../../../../services/PaymentTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/payment-transactions/${id}`, { params: { includeDeleted } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const payment = await response.json();
    return { status: true, message: "Payment transaction retrieved from server", data: payment };
  } else {
    const payment = await paymentTransactionService.findById(id, includeDeleted);
    return { status: true, message: "Payment transaction retrieved locally", data: payment };
  }
};