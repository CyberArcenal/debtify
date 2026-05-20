// src/main/ipc/core/interestRateChangeLog/get/by_id.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");

module.exports = async (params) => {
  const { id } = params;
  const log = await interestRateChangeLogService.getLogById(id);
  return {
    status: true,
    message: "Log retrieved",
    data: log,
  };
};