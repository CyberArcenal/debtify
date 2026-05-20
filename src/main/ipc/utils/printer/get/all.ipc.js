// src/main/ipc/printer/get/all.ipc.js
//@ts-check
const printerService = require("../../../../../services/Printer");

module.exports = async (params) => {
  try {
    const result = await printerService.getAllPrinters();
    return {
      status: true,
      message: "Printers retrieved successfully",
      data: result,
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