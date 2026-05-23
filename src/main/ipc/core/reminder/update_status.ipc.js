// src/main/ipc/core/reminder/update_status.ipc.js


const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params, queryRunner) => {
  const { id, status, errorMessage, user } = params;
  const result = await reminderLogService.updateReminderStatus({ id, status, errorMessage }, user, queryRunner);
  return { status: true, message: "Reminder status updated", data: result };
};