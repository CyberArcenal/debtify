// src/main/ipc/loanApplication/get/all.ipc.js
//@ts-check
const loanApplicationService = require("../../../../../services/LoanApplication");

module.exports = async (params) => {
  try {
    const result = await loanApplicationService.getAllApplications(params);
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