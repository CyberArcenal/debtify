// src/main/ipc/debt/import_csv.ipc.js

const debtService = require("../../../../services/Debt");

module.exports = async (params, queryRunner) => {
  // Import always uses local database (could be extended to server)
  const { filePath, user = "system" } = params;
  const result = await debtService.importFromCSV(filePath, user, queryRunner);
  return { status: true, message: "CSV import completed", data: result };
};