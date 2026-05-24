// src/main/ipc/core/penaltytransaction/get/total_by_debt.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");

module.exports = async (params) => {
  const { debtId, includeDeleted = false } = params;
  const result = await penaltyTransactionService.getTotalPenaltyForDebt(debtId, includeDeleted);
  return { status: true, message: "Total penalty retrieved", data: result };
};