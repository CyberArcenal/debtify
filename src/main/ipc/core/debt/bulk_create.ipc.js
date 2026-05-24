// src/main/ipc/debt/bulk_create.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { debtsArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post('/api/v1/debts/bulk', { debtsArray, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Bulk create completed on server", data: result };
  } else {
    const result = await debtService.bulkCreate(debtsArray, user, queryRunner);
    return { status: true, message: "Bulk create completed locally", data: result };
  }
};