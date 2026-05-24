// src/main/ipc/core/interestRateChangeLog/get/by_id.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/interest-rate-logs/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Log retrieved from server", data: result };
  } else {
    const log = await interestRateChangeLogService.getLogById(id);
    return { status: true, message: "Log retrieved locally", data: log };
  }
};