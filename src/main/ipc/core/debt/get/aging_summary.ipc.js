// src/main/ipc/debt/get/aging_summary.ipc.js
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/debts/aging-summary', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Aging summary retrieved from server", data: result };
  } else {
    const summary = await debtService.getAgingSummary(params.asOfDate);
    return { status: true, message: "Aging summary retrieved locally", data: summary };
  }
};