// src/main/ipc/core/penaltytransaction/create.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const result = await penaltyTransactionService.create(data, user, queryRunner);
  return { status: true, message: "Penalty created", data: result };
};