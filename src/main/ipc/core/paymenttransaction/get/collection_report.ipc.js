// src/main/ipc/core/paymenttransaction/get/collection_report.ipc.js
// (Assuming this file is in get/ folder or root; adjust path accordingly)
const paymentTransactionService = require("../../../../../services/PaymentTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { fromDate, toDate, target } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/payment-transactions/collection-report", {
      params: { fromDate, toDate, target },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const report = await response.json();
    return { status: true, message: "Collection report generated from server", data: report };
  } else {
    const report = await paymentTransactionService.getCollectionReport(fromDate, toDate, target);
    return { status: true, message: "Collection report generated locally", data: report };
  }
};