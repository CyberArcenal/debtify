// src/main/ipc/printer/update.ipc.js
const printerService = require("../../../../services/Printer");

module.exports = async (params, queryRunner) => {
  try {
    const { id, data, user = "system" } = params;
    const result = await printerService.updatePrinter(id, data, user, queryRunner);
    return {
      status: true,
      message: "Printer updated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in updatePrinter:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};