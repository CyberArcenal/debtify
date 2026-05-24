// src/main/ipc/core/penaltytransaction/update.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const result = await penaltyTransactionService.update(id, data, user, queryRunner);
  return { status: true, message: "Penalty updated", data: result };
};