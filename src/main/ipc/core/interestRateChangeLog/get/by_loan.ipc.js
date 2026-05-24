// src/main/ipc/core/interestRateChangeLog/get/by_loan.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { loanId, page = 1, limit = 50 } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/interest-rate-logs/by-loan/${loanId}`, { params: { page, limit } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Logs for loan retrieved from server", data: result };
  } else {
    const result = await interestRateChangeLogService.getLogsForLoan(loanId, page, limit);
    return { status: true, message: "Logs for loan retrieved locally", data: result };
  }
};