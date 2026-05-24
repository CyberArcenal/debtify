// src/main/ipc/core/paymenttransaction/get/statistics.ipc.js
const paymentTransactionService = require("../../../../../services/PaymentTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/payment-transactions/statistics");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const stats = await response.json();
    return { status: true, message: "Statistics retrieved from server", data: stats };
  } else {
    const stats = await paymentTransactionService.getStatistics();
    return { status: true, message: "Statistics retrieved locally", data: stats };
  }
};