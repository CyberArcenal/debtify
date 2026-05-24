// src/main/ipc/core/paymenttransaction/get/by_id.ipc.js
const paymentTransactionService = require("../../../../../services/PaymentTransaction");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const payment = await paymentTransactionService.findById(id, includeDeleted);
  return { status: true, message: "Payment transaction retrieved", data: payment };
};