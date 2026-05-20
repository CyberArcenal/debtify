// src/main/ipc/paymentMethod/get/stats.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");

module.exports = async (params) => {
  try {
    const { methodId } = params;
    const result = await paymentMethodService.getPaymentMethodStats(methodId);
    return {
      status: true,
      message: "Payment method stats retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getPaymentMethodStats:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};