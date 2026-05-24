// src/main/ipc/core/paymenttransaction/export.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params) => {
  const { format = "json", filters = {}, user = "system" } = params;
  const exportData = await paymentTransactionService.exportPayments(format, filters, user);
  return { status: true, message: "Export completed", data: exportData };
};