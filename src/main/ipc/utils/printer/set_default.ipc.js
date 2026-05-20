// src/main/ipc/printer/set_default.ipc.js
const printerService = require("../../../../services/Printer");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await printerService.setDefaultPrinter(id, user, queryRunner);
    return {
      status: true,
      message: "Default printer updated",
      data: result,
    };
  } catch (error) {
    console.error("Error in setDefaultPrinter:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};