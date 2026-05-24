// src/main/ipc/core/paymenttransaction/bulk_create.ipc.js
//@ts-check

const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params, queryRunner) => {
  const { paymentsArray, user = "system" } = params;
  const result = await paymentTransactionService.bulkCreate(paymentsArray, user, queryRunner);
  return { status: true, message: "Bulk create completed", data: result };
};