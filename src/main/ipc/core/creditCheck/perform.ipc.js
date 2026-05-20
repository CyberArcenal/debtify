// src/main/ipc/creditCheck/perform.ipc.js
const creditCheckService = require("../../../../services/CreditCheck");

module.exports = async (params, queryRunner) => {
  try {
    const { debtorId, user = "system" } = params;
    const result = await creditCheckService.performCreditCheck(debtorId, user, queryRunner);
    return {
      status: true,
      message: "Credit check performed successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in performCreditCheck:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};