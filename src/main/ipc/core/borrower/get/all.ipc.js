// src/main/ipc/borrower/get/all.ipc.js
//@ts-check
const borrowerService = require("../../../../../services/Borrower");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // Pass query parameters
    const response = await onlineClient.get('/api/v1/borrowers', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Borrowers retrieved from server", data: result };
  } else {
    const { page, limit, search, sortBy, sortOrder, includeDeleted, ...filters } = params;
    const options = { page, limit, search, sortBy, sortOrder, includeDeleted, ...filters };
    const borrowers = await borrowerService.findAll(options);
    return { status: true, message: "Borrowers retrieved locally", data: borrowers };
  }
};


