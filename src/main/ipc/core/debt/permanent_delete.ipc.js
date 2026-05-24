// src/main/ipc/debt/permanent_delete.ipc.js
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
    const response = await onlineClient.delete(`/api/v1/debts/${id}/permanent`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    return { status: true, message: "Debt permanently deleted on server", data: null };
  } else {
    await debtService.permanentlyDelete(id, user, queryRunner);
    return { status: true, message: "Debt permanently deleted locally", data: null };
  }
};