// src/main/ipc/core/penaltytransaction/permanent_delete.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  await penaltyTransactionService.permanentlyDelete(id, user, queryRunner);
  return { status: true, message: "Penalty permanently deleted", data: null };
};