// src/main/ipc/loanApplication/get/by_id.ipc.js
const loanApplicationService = require("../../../../../services/LoanApplication");

module.exports = async (params) => {
  try {
    const { id } = params;
    const result = await loanApplicationService.getApplicationById(id);
    return {
      status: true,
      message: "Loan application retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getApplicationById:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};