// src/main/ipc/paymentMethod/delete.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    await paymentMethodService.deletePaymentMethod(id, user, queryRunner);
    return {
      status: true,
      message: "Payment method deleted successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in deletePaymentMethod:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};