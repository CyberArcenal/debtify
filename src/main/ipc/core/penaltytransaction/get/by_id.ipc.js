// src/main/ipc/core/penaltytransaction/get/by_id.ipc.js
//@ts-check

const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const penalty = await penaltyTransactionService.findById(id, includeDeleted);
  return { status: true, message: "Penalty transaction retrieved", data: penalty };
};