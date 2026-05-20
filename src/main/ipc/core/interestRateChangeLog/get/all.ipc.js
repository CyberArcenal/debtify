// src/main/ipc/core/interestRateChangeLog/get/all.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");

module.exports = async (params) => {
  const { filters, page = 1, limit = 50 } = params;
  const result = await interestRateChangeLogService.getAllLogs(filters, page, limit);
  return {
    status: true,
    message: "Interest rate change logs retrieved",
    data: result,
  };
};