// src/main/ipc/core/paymenttransaction/search.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/payment-transactions/search", {
      params: { searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Search completed on server", data: result };
  } else {
    const options = { search: searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount };
    const payments = await paymentTransactionService.findAll(options);
    return { status: true, message: "Search completed locally", data: payments };
  }
};