// src/main/ipc/core/penaltytransaction/get/total_by_debt.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { debtId, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/penalty-transactions/total-by-debt`, { params: { debtId, includeDeleted } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Total penalty retrieved from server", data: result };
  } else {
    const result = await penaltyTransactionService.getTotalPenaltyForDebt(debtId, includeDeleted);
    return { status: true, message: "Total penalty retrieved locally", data: result };
  }
};