// src/main/ipc/debt/get/all.ipc.js

const debtService = require("../../../../../services/Debt");

module.exports = async (params) => {
  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    includeDeleted,
    status,
    borrowerId,
    dueDateFrom,
    dueDateTo,
    minTotalAmount,
    maxTotalAmount,
  } = params;
  const options = {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    includeDeleted,
    status,
    borrowerId,
    dueDateFrom,
    dueDateTo,
    minTotalAmount,
    maxTotalAmount,
  };
  const debts = await debtService.findAll(options);
  return { status: true, message: "Debts retrieved", data: debts };
};