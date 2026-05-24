// src/main/ipc/debt/get/all.ipc.js
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/debts', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Debts retrieved from server", data: result };
  } else {
    const { page, limit, search, sortBy, sortOrder, includeDeleted, status, borrowerId, dueDateFrom, dueDateTo, minTotalAmount, maxTotalAmount } = params;
    const options = { page, limit, search, sortBy, sortOrder, includeDeleted, status, borrowerId, dueDateFrom, dueDateTo, minTotalAmount, maxTotalAmount };
    const debts = await debtService.findAll(options);
    return { status: true, message: "Debts retrieved locally", data: debts };
  }
};