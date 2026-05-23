// src/main/ipc/core/reminder/delete.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params, queryRunner) => {
  const { id, user } = params;
  await reminderLogService.deleteReminder({ id }, user, queryRunner);
  return { status: true, message: "Reminder deleted", data: null };
};