// src/main/ipc/core/loanagreement/export.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");

module.exports = async (params) => {
  const { format = "json", filters = {}, user = "system" } = params;
  const exportData = await loanAgreementService.exportAgreements(format, filters, user);
  return { status: true, message: "Export completed", data: exportData };
};