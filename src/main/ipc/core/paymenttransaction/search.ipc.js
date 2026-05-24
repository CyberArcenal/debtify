// src/main/ipc/core/paymenttransaction/search.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");

module.exports = async (params) => {
  const { searchTerm, page, limit, debtId, borrowerId, minAmount, maxAmount } = params;
  const options = {
    search: searchTerm,
    page,
    limit,
    debtId,
    borrowerId,
    minAmount,
    maxAmount,
  };
  const payments = await paymentTransactionService.findAll(options);
  return { status: true, message: "Search completed", data: payments };
};