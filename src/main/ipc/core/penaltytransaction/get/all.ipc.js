// src/main/ipc/core/penaltytransaction/get/all.ipc.js
//@ts-check

const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");


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
    penaltyDateFrom,
    penaltyDateTo,
    minAmount,
    maxAmount,
    reason,
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
    penaltyDateFrom,
    penaltyDateTo,
    minAmount,
    maxAmount,
    reason,
  };
  const penalties = await penaltyTransactionService.findAll(options);
  return { status: true, message: "Penalties retrieved", data: penalties };
};