// src/main/ipc/loanApplication/get/all.ipc.js
//@ts-check
const loanApplicationService = require("../../../../../services/LoanApplication");

module.exports = async (params) => {
  try {
    const { filters } = params;
    const result = await loanApplicationService.getAllApplications(filters || {});
    return {
      status: true,
      message: "Loan applications retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getAllApplications:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};