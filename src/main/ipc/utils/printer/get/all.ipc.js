// src/main/ipc/printer/get/all.ipc.js
//@ts-check
const printerService = require("../../../../../services/Printer");

module.exports = async (params) => {
  try {
    const { page = 1, limit = 10 } = params;
    const result = await printerService.getAllPrinters(page, limit);
    return {
      status: true,
      message: "Printers retrieved successfully",
      data: result, // { data: [], pagination: {} }
    };
  } catch (error) {
    console.error("Error in getAllPrinters:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};