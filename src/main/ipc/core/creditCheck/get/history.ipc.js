// src/main/ipc/creditCheck/get/history.ipc.js
const creditCheckService = require("../../../../../services/CreditCheck");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  try {
    const { debtorId, page = 1, limit = 20 } = params;
    const mode = await syncMode();

    if (mode === "online") {
      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);
      const response = await onlineClient.get('/api/v1/credit-check/history', { params: { debtorId, page, limit } });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return { status: true, message: "Credit check history retrieved from server", data: result.data };
    } else {
      const result = await creditCheckService.getCreditCheckHistory(debtorId, page, limit);
      return { status: true, message: "Credit check history retrieved locally", data: result };
    }
  } catch (error) {
    console.error("Error in getCreditCheckHistory:", error);
    return { status: false, message: error.message, data: null };
  }
};