// src/main/ipc/borrower/permanent_delete.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.delete(`/api/v1/borrowers/permanent/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    // Assume server returns { status, message, data: null }
    const result = await response.json();
    return { status: true, message: "Borrower permanently deleted on server", data: null };
  } else {
    await borrowerService.permanentlyDelete(id, user, queryRunner);
    return { status: true, message: "Borrower permanently deleted locally", data: null };
  }
};