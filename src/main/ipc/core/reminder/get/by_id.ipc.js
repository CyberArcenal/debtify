// src/main/ipc/core/reminder/get/by_id.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/reminders/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const reminder = await response.json();
    return { status: true, message: "Reminder retrieved from server", data: reminder };
  } else {
    const reminder = await reminderLogService.getReminderById({ id });
    return { status: true, message: "Reminder retrieved locally", data: reminder };
  }
};