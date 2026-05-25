// src/main/ipc/debt/recalculate_remaining.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post(`/api/v1/debts/${id}/recalculate`, { user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Remaining amount recalculated on server", data: result };
  } else {
    const result = await debtService.recalculateRemainingAmount(id, user, queryRunner);
    return { status: true, message: "Remaining amount recalculated locally", data: result };
  }
};