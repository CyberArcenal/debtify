// src/main/ipc/core/reminder/retry.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params, queryRunner) => {
  const { id, user } = params;
  const result = await reminderLogService.retryReminder({ id }, user, queryRunner);
  return { status: true, message: "Reminder retried", data: result };
};