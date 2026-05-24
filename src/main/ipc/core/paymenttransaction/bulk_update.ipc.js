// src/main/ipc/core/paymenttransaction/bulk_update.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { updatesArray, user = "system" } = params;
  const result = await paymentTransactionService.bulkUpdate(updatesArray, user, queryRunner);
  return { status: true, message: "Bulk update completed", data: result };
};