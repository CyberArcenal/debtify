// src/main/ipc/core/loanagreement/import_csv.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  const result = await loanAgreementService.importFromCSV(filePath, user, queryRunner);
  return { status: true, message: "CSV import completed", data: result };
};