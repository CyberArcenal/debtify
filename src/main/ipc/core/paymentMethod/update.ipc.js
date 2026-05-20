// src/main/ipc/paymentMethod/update.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");

module.exports = async (params, queryRunner) => {
  try {
    const { id, data, user = "system" } = params;
    const result = await paymentMethodService.updatePaymentMethod(id, data, user, queryRunner);
    return {
      status: true,
      message: "Payment method updated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in updatePaymentMethod:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};