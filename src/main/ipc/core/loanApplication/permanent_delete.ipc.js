// src/main/ipc/loanApplication/permanent_delete.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    await loanApplicationService.permanentlyDeleteApplication(id, user, queryRunner);
    return {
      status: true,
      message: "Loan application permanently deleted",
      data: null,
    };
  } catch (error) {
    console.error("Error in permanentlyDeleteApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};