// src/main/ipc/creditCheck/delete_log.ipc.js
const creditCheckService = require("../../../../services/CreditCheck");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  try {
    const { logId, user = "system" } = params;
    const mode = await syncMode();

    if (mode === "online") {
      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);
      const response = await onlineClient.delete(`/api/v1/credit-check/logs/${logId}`, { user });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return { status: true, message: "Credit check log deleted on server", data: result.data };
    } else {
      await creditCheckService.deleteCreditCheckLog(logId, user, queryRunner);
      return { status: true, message: "Credit check log deleted locally", data: null };
    }
  } catch (error) {
    console.error("Error in deleteCreditCheckLog:", error);
    return { status: false, message: error.message, data: null };
  }
};