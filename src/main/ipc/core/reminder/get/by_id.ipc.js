// src/main/ipc/core/reminder/get/by_id.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");

module.exports = async (params) => {
  const { id } = params;
  const reminder = await reminderLogService.getReminderById({ id });
  return { status: true, message: "Reminder retrieved", data: reminder };
};