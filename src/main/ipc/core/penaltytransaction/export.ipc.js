// src/main/ipc/core/penaltytransaction/export.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params) => {
  const { format = "json", filters = {}, user = "system" } = params;
  const exportData = await penaltyTransactionService.exportPenalties(format, filters, user);
  return { status: true, message: "Export completed", data: exportData };
};