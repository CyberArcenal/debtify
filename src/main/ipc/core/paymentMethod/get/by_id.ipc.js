// src/main/ipc/paymentMethod/get/by_id.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");

module.exports = async (params) => {
  try {
    const { id } = params;
    const result = await paymentMethodService.getPaymentMethodById(id);
    return {
      status: true,
      message: "Payment method retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getPaymentMethodById:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};