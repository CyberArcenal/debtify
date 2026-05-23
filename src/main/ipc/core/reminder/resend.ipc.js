// src/main/ipc/core/reminder/resend.ipc.js
const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params, queryRunner) => {
  const { id, user } = params;
  const result = await reminderLogService.resendReminder({ id }, user, queryRunner);
  return { status: true, message: "Reminder resent", data: result };
};