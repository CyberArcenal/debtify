// src/main/ipc/core/paymenttransaction/get/all.ipc.js
//@ts-check

const paymentTransactionService = require("../../../../../services/PaymentTransaction");


module.exports = async (params) => {
  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    includeDeleted,
    debtId,
    borrowerId,
    reference,
    paymentDateFrom,
    paymentDateTo,
    minAmount,
    maxAmount,
  } = params;
  const options = {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    includeDeleted,
    debtId,
    borrowerId,
    reference,
    paymentDateFrom,
    paymentDateTo,
    minAmount,
    maxAmount,
  };
  const payments = await paymentTransactionService.findAll(options);
  return { status: true, message: "Payments retrieved", data: payments };
};