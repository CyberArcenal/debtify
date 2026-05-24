// src/main/ipc/core/interestRateChangeLog/get/all.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { filters, page = 1, limit = 50 } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/interest-rate-logs', { params: { filters, page, limit } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Logs retrieved from server", data: result };
  } else {
    const result = await interestRateChangeLogService.getAllLogs(filters, page, limit);
    return { status: true, message: "Logs retrieved locally", data: result };
  }
};