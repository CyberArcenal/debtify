// src/main/ipc/debt/apply_forgiveness.ipc.js
const debtService = require("../../../../services/Debt");

module.exports = async (params, queryRunner) => {
  const { id, amountForgiven, user = "system", reason = null } = params;
  const result = await debtService.applyForgiveness(id, amountForgiven, user, reason, queryRunner);
  return { status: true, message: "Debt forgiveness applied", data: result };
};