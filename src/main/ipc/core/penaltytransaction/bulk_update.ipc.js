// src/main/ipc/core/penaltytransaction/bulk_update.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const result = await penaltyTransactionService.bulkUpdate(updatesArray, user, queryRunner);
  return { status: true, message: "Bulk update completed", data: result };
};