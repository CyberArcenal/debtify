// src/main/ipc/core/penaltytransaction/bulk_create.ipc.js
//@ts-check

const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { penaltiesArray, user = "system" } = params;
  const result = await penaltyTransactionService.bulkCreate(penaltiesArray, user, queryRunner);
  return { status: true, message: "Bulk create completed", data: result };
};