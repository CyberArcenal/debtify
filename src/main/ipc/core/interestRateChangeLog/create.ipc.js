// src/main/ipc/core/interestRateChangeLog/create.ipc.js
const interestRateChangeLogService = require("../../../../services/InterestRateChangeLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const {
    settingKey,
    oldValue,
    newValue,
    userId,
    loanId = null,
    reason = null,
  } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post("/api/v1/interest-rate-logs", {
      settingKey,
      oldValue,
      newValue,
      userId,
      loanId,
      reason,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Log created on server", data: result };
  } else {
    const log = await interestRateChangeLogService.createLog(
      settingKey,
      oldValue,
      newValue,
      userId,
      loanId,
      reason,
      queryRunner,
    );
    return { status: true, message: "Log created locally", data: log };
  }
};
