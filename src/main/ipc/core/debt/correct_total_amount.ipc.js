// src/main/ipc/debt/correct_total_amount.ipc.js
const debtService = require("../../../../services/Debt");

module.exports = async (params, queryRunner) => {
  const { id, newTotalAmount, user = "system" } = params;
  const result = await debtService.correctTotalAmount(id, newTotalAmount, user, queryRunner);
  return { status: true, message: "Debt total amount corrected", data: result };
};