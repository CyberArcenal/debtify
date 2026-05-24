// src/main/ipc/core/paymenttransaction/permanent_delete.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.delete(`/api/v1/payment-transactions/permanent/${id}`, { data: { user } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    return { status: true, message: "Payment permanently deleted on server", data: null };
  } else {
    await paymentTransactionService.permanentlyDelete(id, user, queryRunner);
    return { status: true, message: "Payment permanently deleted locally", data: null };
  }
};