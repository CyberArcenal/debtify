// src/main/ipc/creditCheck/delete_log.ipc.js
//@ts-check

const creditCheckService = require("../../../../services/CreditCheck");

module.exports = async (params, queryRunner) => {
  try {
    const { logId, user = "system" } = params;
    await creditCheckService.deleteCreditCheckLog(logId, user, queryRunner);
    return {
      status: true,
      message: "Credit check log deleted successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in deleteCreditCheckLog:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};