// src/main/ipc/creditCheck/perform.ipc.js
const creditCheckService = require("../../../../services/CreditCheck");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  try {
    const { debtorId, user = "system" } = params;
    const mode = await syncMode();

    if (mode === "online") {
      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);
      const response = await onlineClient.post('/api/v1/credit-check/perform', { debtorId, user });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return { status: true, message: "Credit check performed on server", data: result.data };
    } else {
      const result = await creditCheckService.performCreditCheck(debtorId, user, queryRunner);
      return { status: true, message: "Credit check performed locally", data: result };
    }
  } catch (error) {
    console.error("Error in performCreditCheck:", error);
    return { status: false, message: error.message, data: null };
  }
};