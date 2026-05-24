// src/main/ipc/borrower/bulk_update.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.put('/api/v1/borrowers/bulkUpdate', { updatesArray, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Bulk update completed on server", data: result };
  } else {
    const result = await borrowerService.bulkUpdate(updatesArray, user, queryRunner);
    return { status: true, message: "Bulk update completed locally", data: result };
  }
};