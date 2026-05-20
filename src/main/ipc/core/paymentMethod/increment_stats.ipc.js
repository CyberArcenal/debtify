// src/main/ipc/paymentMethod/increment_stats.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");

module.exports = async (params, queryRunner) => {
  try {
    const { methodId, amount } = params;
    await paymentMethodService.incrementPaymentMethodStats(methodId, amount, queryRunner);
    return {
      status: true,
      message: "Payment method stats updated",
      data: null,
    };
  } catch (error) {
    console.error("Error in incrementPaymentMethodStats:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};