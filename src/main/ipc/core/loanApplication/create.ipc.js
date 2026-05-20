// src/main/ipc/loanApplication/create.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");

module.exports = async (params, queryRunner) => {
  try {
    const { data, user = "system" } = params;
    const result = await loanApplicationService.createApplication(data, user, queryRunner);
    return {
      status: true,
      message: "Loan application created successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in createApplication:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};