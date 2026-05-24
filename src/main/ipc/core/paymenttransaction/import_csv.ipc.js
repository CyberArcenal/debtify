// src/main/ipc/core/paymenttransaction/import_csv.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  const result = await paymentTransactionService.importFromCSV(filePath, user, queryRunner);
  return { status: true, message: "CSV import completed", data: result };
};