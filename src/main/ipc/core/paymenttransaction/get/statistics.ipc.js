// src/main/ipc/core/paymenttransaction/get/statistics.ipc.js
const paymentTransactionService = require("../../../../../services/PaymentTransaction");

module.exports = async () => {
  const stats = await paymentTransactionService.getStatistics();
  return { status: true, message: "Statistics retrieved", data: stats };
};