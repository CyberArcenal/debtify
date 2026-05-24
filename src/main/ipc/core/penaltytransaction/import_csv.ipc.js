// src/main/ipc/core/penaltytransaction/import_csv.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  const result = await penaltyTransactionService.importFromCSV(filePath, user, queryRunner);
  return { status: true, message: "CSV import completed", data: result };
};