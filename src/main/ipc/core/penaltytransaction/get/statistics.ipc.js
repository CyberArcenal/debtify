// src/main/ipc/core/penaltytransaction/get/statistics.ipc.js
const penaltyTransactionService = require("../../../../../services/PenaltyTransaction");

module.exports = async () => {
  const stats = await penaltyTransactionService.getStatistics();
  return { status: true, message: "Statistics retrieved", data: stats };
};