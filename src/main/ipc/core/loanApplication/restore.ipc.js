// src/main/ipc/loanApplication/restore.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await loanApplicationService.restoreApplication(id, user, queryRunner);
    return {
      status: true,
      message: "Loan application restored",
      data: result,
    };
  } catch (error) {
    console.error("Error in restoreApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};