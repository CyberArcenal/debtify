// src/main/ipc/creditCheck/get/history.ipc.js
//@ts-check

const creditCheckService = require("../../../../../services/CreditCheck");

module.exports = async (params) => {
  try {
    const { debtorId } = params;
    const result = await creditCheckService.getCreditCheckHistory(debtorId);
    return {
      status: true,
      message: "Credit check history retrieved successfully",
      data: result,
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