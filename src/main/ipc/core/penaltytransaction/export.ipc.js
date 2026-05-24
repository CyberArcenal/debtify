// src/main/ipc/core/penaltytransaction/export.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { format = "json", filters = {}, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/penalty-transactions/export", { params: { format, filters, user } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const exportData = await response.json();
    return { status: true, message: "Export completed from server", data: exportData };
  } else {
    const exportData = await penaltyTransactionService.exportPenalties(format, filters, user);
    return { status: true, message: "Export completed locally", data: exportData };
  }
};