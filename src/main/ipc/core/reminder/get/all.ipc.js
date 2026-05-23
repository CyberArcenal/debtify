// src/main/ipc/core/reminder/get/all.ipc.js

const { reminderLogService } = require("../../../../../services/ReminderLog");

module.exports = async (params) => {
  const result = await reminderLogService.getAllReminders(params);
  return { status: true, message: "Reminders retrieved", ...result };
};