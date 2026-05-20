// src/main/ipc/core/interestRateChangeLog/delete.ipc.js
const interestRateChangeLogService = require("../../../../services/InterestRateChangeLog");

module.exports = async (params, queryRunner) => {
  const { id, userId } = params;
  await interestRateChangeLogService.deleteLog(id, userId, queryRunner);
  return {
    status: true,
    message: "Log deleted",
    data: null,
  };
};