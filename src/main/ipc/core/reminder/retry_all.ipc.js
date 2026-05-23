// src/main/ipc/core/reminder/retry_all.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params, queryRunner) => {
  const { filters, user } = params;
  const result = await reminderLogService.retryAllFailedReminders({ filters }, user, queryRunner);
  return { status: true, message: "Retry all completed", data: result };
};