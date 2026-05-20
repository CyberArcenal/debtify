// src/main/ipc/paymentMethod/set_default.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await paymentMethodService.setDefaultPaymentMethod(id, user, queryRunner);
    return {
      status: true,
      message: "Default payment method updated",
      data: result,
    };
  } catch (error) {
    console.error("Error in setDefaultPaymentMethod:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};