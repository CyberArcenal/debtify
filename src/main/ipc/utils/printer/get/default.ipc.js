// src/main/ipc/printer/get/default.ipc.js
const printerService = require("../../../../../services/Printer");

module.exports = async () => {
  try {
    const defaultPrinter = await printerService.getDefaultPrinter();
    return {
      status: true,
      message: "Default printer retrieved",
      data: defaultPrinter,
    };
  } catch (error) {
    // Hindi itinapon ang error kung walang default – ibalik ang null
    if (error.message === "No default printer configured") {
      return {
        status: true,
        message: "No default printer configured",
        data: null,
      };
    }
    console.error("Error in getDefaultPrinter:", error);
    return {
      status: false,
      message: error.message,
      data: null,
    };
  }
};