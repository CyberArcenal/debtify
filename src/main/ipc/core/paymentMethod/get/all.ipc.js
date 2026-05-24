// src/main/ipc/core/paymentMethod/get/all.ipc.js
//@ts-check
const paymentMethodService = require("../../../../../services/PaymentMethod");

module.exports = async (params) => {
  try {
    const { page = 1, limit = 10 } = params;
    const result = await paymentMethodService.getAllPaymentMethods(page, limit);
    return {
      status: true,
      message: "Payment methods retrieved successfully",
      data: result, // { data: [], pagination: {} }
    };
  } catch (error) {
    console.error("Error in getAllPaymentMethods:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};