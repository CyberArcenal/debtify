// src/main/ipc/printer/delete.ipc.js
const printerService = require("../../../../services/Printer");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    await printerService.deletePrinter(id, user, queryRunner);
    return {
      status: true,
      message: "Printer deleted successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in deletePrinter:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};