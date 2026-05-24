// src/main/ipc/core/paymenttransaction/update.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const result = await paymentTransactionService.update(id, data, user, queryRunner);
  return { status: true, message: "Payment updated", data: result };
};