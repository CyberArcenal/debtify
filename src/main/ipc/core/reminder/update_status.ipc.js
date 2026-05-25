// src/main/ipc/core/reminder/update_status.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, status, errorMessage, user } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.patch(`/api/v1/reminders/${id}/status`, { status, errorMessage, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Reminder status updated on server", data: result };
  } else {
    const result = await reminderLogService.updateReminderStatus({ id, status, errorMessage }, user, queryRunner);
    return { status: true, message: "Reminder status updated locally", data: result };
  }
};