// src/main/ipc/printer/test.ipc.js
const printerService = require("../../../../services/Printer");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user = "system" } = params;
    const result = await printerService.testPrinter(id, user, queryRunner);
    return {
      status: true,
      message: result.message,
      data: { success: result.success },
    };
  } catch (error) {
    console.error("Error in testPrinter:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};