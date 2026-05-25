// src/main/ipc/borrower/get/by_id.ipc.js
const borrowerService = require("../../../../../services/Borrower");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/borrowers/${id}?includeDeleted=${includeDeleted}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Borrower fetched from server", data: result };
  } else {
    const borrower = await borrowerService.findById(id, includeDeleted);
    return { status: true, message: "Borrower retrieved locally", data: borrower };
  }
};