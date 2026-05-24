// src/main/ipc/core/penaltytransaction/delete.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const result = await penaltyTransactionService.delete(id, user, queryRunner);
  return { status: true, message: "Penalty soft deleted", data: result };
};