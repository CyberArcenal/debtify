// src/main/ipc/debt/get/debts_in_bucket.ipc.js
const debtService = require("../../../../../services/Debt");

module.exports = async (params) => {
  const { bucketRange, asOfDate, page = 1, limit = 10 } = params;
  const result = await debtService.getDebtsInBucket(bucketRange, asOfDate, page, limit);
  return { status: true, message: "Debts in bucket retrieved", data: result };
};