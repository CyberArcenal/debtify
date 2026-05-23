// src/main/ipc/debt/get/aging_summary.ipc.js
const debtService = require("../../../../../services/Debt");

module.exports = async (params) => {
  const { asOfDate } = params;
  const summary = await debtService.getAgingSummary(asOfDate);
  return { status: true, message: "Aging summary retrieved", data: summary };
};