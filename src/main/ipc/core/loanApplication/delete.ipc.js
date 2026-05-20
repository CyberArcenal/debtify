// src/main/ipc/loanApplication/delete.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await loanApplicationService.deleteApplication(id, user, queryRunner);
    return {
      status: true,
      message: "Loan application soft deleted",
      data: result,
    };
  } catch (error) {
    console.error("Error in deleteApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};