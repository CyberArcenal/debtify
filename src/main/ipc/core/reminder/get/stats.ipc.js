// src/main/ipc/core/reminder/get/stats.ipc.js
const { reminderLogService } = require("../../../../../services/ReminderLog");

module.exports = async (params) => {
  const { startDate, endDate } = params;
  const stats = await reminderLogService.getReminderStats({ startDate, endDate });
  return { status: true, message: "Stats retrieved", data: stats };
};