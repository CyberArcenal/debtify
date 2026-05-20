// src/main/ipc/paymentMethod/get/all.ipc.js
//@ts-check
const paymentMethodService = require("../../../../../services/PaymentMethod");

module.exports = async (params) => {
  try {
    const result = await paymentMethodService.getAllPaymentMethods();
    return {
      status: true,
      message: "Payment methods retrieved successfully",
      data: result,
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