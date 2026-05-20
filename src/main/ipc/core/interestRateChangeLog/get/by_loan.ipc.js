// src/main/ipc/core/interestRateChangeLog/get/by_loan.ipc.js
const interestRateChangeLogService = require("../../../../../services/InterestRateChangeLog");

module.exports = async (params) => {
  const { loanId, page = 1, limit = 50 } = params;
  const result = await interestRateChangeLogService.getLogsForLoan(loanId, page, limit);
  return {
    status: true,
    message: "Logs for loan retrieved",
    data: result,
  };
};