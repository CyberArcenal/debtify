// src/main/ipc/debt/search.ipc.js
const debtService = require("../../../../services/Debt");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/debts/search', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Search completed on server", data: result };
  } else {
    const { searchTerm, page, limit, status, borrowerId } = params;
    const options = { search: searchTerm, page, limit, status, borrowerId };
    const debts = await debtService.findAll(options);
    return { status: true, message: "Search completed locally", data: debts };
  }
};