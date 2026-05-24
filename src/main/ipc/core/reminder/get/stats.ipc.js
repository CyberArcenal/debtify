// src/main/ipc/core/reminder/get/stats.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { startDate, endDate } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/reminders/stats", { params: { startDate, endDate } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const stats = await response.json();
    return { status: true, message: "Stats retrieved from server", data: stats };
  } else {
    const stats = await reminderLogService.getReminderStats({ startDate, endDate });
    return { status: true, message: "Stats retrieved locally", data: stats };
  }
};