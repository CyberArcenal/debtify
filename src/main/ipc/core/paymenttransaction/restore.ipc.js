// src/main/ipc/core/paymenttransaction/restore.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const result = await paymentTransactionService.restore(id, user, queryRunner);
  return { status: true, message: "Payment restored", data: result };
};