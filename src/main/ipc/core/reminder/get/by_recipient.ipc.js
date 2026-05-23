// src/main/ipc/core/reminder/get/by_recipient.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");

module.exports = async (params) => {
  const { recipient_email, page, limit } = params;
  const result = await reminderLogService.getRemindersByRecipient({ recipient_email, page, limit });
  return { status: true, message: "Reminders by recipient retrieved", ...result };
};