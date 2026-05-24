// src/main/ipc/core/penaltytransaction/search.ipc.js
const penaltyTransactionService = require("../../../../services/PenaltyTransaction");

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
  const penalties = await penaltyTransactionService.findAll(options);
  return { status: true, message: "Search completed", data: penalties };
};