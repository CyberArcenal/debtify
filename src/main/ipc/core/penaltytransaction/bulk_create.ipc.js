// src/main/ipc/core/penaltytransaction/bulk_create.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { penaltiesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post("/api/v1/penalty-transactions/bulk-create", { penaltiesArray, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Bulk create completed on server", data: result };
  } else {
    const result = await penaltyTransactionService.bulkCreate(penaltiesArray, user, queryRunner);
    return { status: true, message: "Bulk create completed locally", data: result };
  }
};