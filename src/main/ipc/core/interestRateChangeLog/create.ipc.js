// src/main/ipc/core/interestRateChangeLog/create.ipc.js
const interestRateChangeLogService = require("../../../../services/InterestRateChangeLog");

module.exports = async (params, queryRunner) => {
  const { settingKey, oldValue, newValue, userId, loanId = null, reason = null } = params;
  const log = await interestRateChangeLogService.createLog(
    settingKey,
    oldValue,
    newValue,
    userId,
    loanId,
    reason,
    queryRunner
  );
  return {
    status: true,
    message: "Interest rate change logged",
    data: log,
  };
};