// src/main/ipc/core/paymenttransaction/delete.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const result = await paymentTransactionService.delete(id, user, queryRunner);
  return { status: true, message: "Payment soft deleted", data: result };
};