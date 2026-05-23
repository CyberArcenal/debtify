// src/main/ipc/creditCheck/get/history.ipc.js
const creditCheckService = require("../../../../../services/CreditCheck");

module.exports = async (params) => {
  try {
    const { debtorId, page = 1, limit = 20 } = params;
    const result = await creditCheckService.getCreditCheckHistory(debtorId, page, limit);
    return {
      status: true,
      message: "Credit check history retrieved successfully",
      data: result
    };
  } catch (error) {
    console.error("Error in getCreditCheckHistory:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};