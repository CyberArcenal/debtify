// src/main/ipc/core/reminder/search.ipc.js


const { reminderLogService } = require("../../../../services/ReminderLog");

module.exports = async (params) => {
  const { keyword, page, limit } = params;
  const result = await reminderLogService.searchReminders({ keyword, page, limit });
  return { status: true, message: "Search completed", ...result };
};