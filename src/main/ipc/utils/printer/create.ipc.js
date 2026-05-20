// src/main/ipc/printer/create.ipc.js
const printerService = require("../../../../services/Printer");

module.exports = async (params, queryRunner) => {
  try {
    const { data, user = "system" } = params;
    const result = await printerService.createPrinter(data, user, queryRunner);
    return {
      status: true,
      message: "Printer added successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in createPrinter:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};