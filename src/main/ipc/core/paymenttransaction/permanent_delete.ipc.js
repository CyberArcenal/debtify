// src/main/ipc/core/paymenttransaction/permanent_delete.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  await paymentTransactionService.permanentlyDelete(id, user, queryRunner);
  return { status: true, message: "Payment permanently deleted", data: null };
};