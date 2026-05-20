// src/main/ipc/loanApplication/update.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { id, data, user = "system" } = params;
    const result = await loanApplicationService.updateApplication(id, data, user, queryRunner);
    return {
      status: true,
      message: "Loan application updated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in updateApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};