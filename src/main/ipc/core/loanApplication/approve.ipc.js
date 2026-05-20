// src/main/ipc/loanApplication/approve.ipc.js
//@ts-check
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await loanApplicationService.approveApplication(id, user, queryRunner);
    return {
      status: true,
      message: "Loan application approved and debt created",
      data: result,
    };
  } catch (error) {
    console.error("Error in approveApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};