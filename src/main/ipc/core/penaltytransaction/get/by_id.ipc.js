// src/main/ipc/core/penaltytransaction/get/by_id.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/penalty-transactions/${id}`, { params: { includeDeleted } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const penalty = await response.json();
    return { status: true, message: "Penalty transaction retrieved from server", data: penalty };
  } else {
    const penalty = await penaltyTransactionService.findById(id, includeDeleted);
    return { status: true, message: "Penalty transaction retrieved locally", data: penalty };
  }
};