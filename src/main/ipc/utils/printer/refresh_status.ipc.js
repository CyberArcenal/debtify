// src/main/ipc/printer/refresh_status.ipc.js
const printerService = require("../../../../services/Printer");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await printerService.refreshPrinterStatus(id, user, queryRunner);
    return {
      status: true,
      message: "Printer status refreshed",
      data: result,
    };
  } catch (error) {
    console.error("Error in refreshPrinterStatus:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};