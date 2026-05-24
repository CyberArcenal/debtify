// src/main/ipc/core/reminder/get/by_recipient.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { recipient_email, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/reminders/by-recipient", { params: { recipient_email, page, limit } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Reminders by recipient retrieved from server", ...result };
  } else {
    const result = await reminderLogService.getRemindersByRecipient({ recipient_email, page, limit });
    return { status: true, message: "Reminders by recipient retrieved locally", ...result };
  }
};