// src/main/ipc/loanApplication/reject.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { id, reason = null, user = "system" } = params;
    const result = await loanApplicationService.rejectApplication(id, reason, user, queryRunner);
    return {
      status: true,
      message: "Loan application rejected",
      data: result,
    };
  } catch (error) {
    console.error("Error in rejectApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};