// src/main/ipc/printer/get/by_id.ipc.js
const printerService = require("../../../../../services/Printer");

module.exports = async (params) => {
  try {
    const { id } = params;
    const result = await printerService.getPrinterById(id);
    return {
      status: true,
      message: "Printer retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getPrinterById:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};