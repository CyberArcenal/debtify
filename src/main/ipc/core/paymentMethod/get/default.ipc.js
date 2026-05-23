// src/main/ipc/paymentMethod/get/default.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");

module.exports = async () => {
  try {
    const defaultMethod = await paymentMethodService.getDefaultPaymentMethod();
    return {
      status: true,
      message: "Default payment method retrieved",
      data: defaultMethod,
    };
  } catch (error) {
    console.error("Error in getDefaultPaymentMethod:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};