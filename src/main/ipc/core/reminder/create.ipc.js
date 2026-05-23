// src/main/ipc/core/reminder/create.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params, queryRunner) => {
  const { data, user } = params; // data = { to, subject, html, text }
  const result = await reminderLogService.createReminder(data, user, queryRunner);
  return { status: true, message: "Reminder log created", data: result };
};