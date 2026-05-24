// src/main/ipc/core/paymentMethod/create.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");

module.exports = async (params, queryRunner) => {
  try {
    const { data, user = "system" } = params;
    const result = await paymentMethodService.createPaymentMethod(data, user, queryRunner);
    return {
      status: true,
      message: "Payment method created successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in createPaymentMethod:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};