// src/main/ipc/core/penaltytransaction/restore.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const result = await penaltyTransactionService.restore(id, user, queryRunner);
  return { status: true, message: "Penalty restored", data: result };
};