// // src/services/PrinterService.js
// //@ts-check
// const auditLogger = require("../utils/auditLogger");
// const Debt = require("../entities/Debt");
// const PaymentTransaction = require("../entities/PaymentTransaction");
// const {
//   companyName,
//   receiptFooterMessage,
// } = require("../utils/system");

// const { logger } = require("../utils/logger");

// class PrinterService {
//   constructor() {
//     this.driver = null;
//     this.isReady = false; // track if printer is ready (last print success)
//   }

//   // @ts-ignore
//   async _loadDriver(type) {
//     switch (type.toLowerCase()) {
//       case "thermal":
//         const ThermalDriver = require("../drivers/thermalDriver");
//         return new ThermalDriver();
//       case "dot_matrix":
//         console.warn(
//           "[PrinterService] Dot matrix driver not implemented, falling back to thermal",
//         );
//         const FallbackThermal = require("../drivers/thermalDriver");
//         return new FallbackThermal();
//       case "laser":
//         console.warn(
//           "[PrinterService] Laser printer driver not implemented, falling back to thermal",
//         );
//         const FallbackThermal2 = require("../drivers/thermalDriver");
//         return new FallbackThermal2();
//       default:
//         throw new Error(`Unsupported printer type: ${type}`);
//     }
//   }

//   async _getDriver() {
//     if (!this.driver) {
//       const type = await receiptPrinterType();
//       this.driver = await this._loadDriver(type);
//     }
//     return this.driver;
//   }

//   /**
//    * Print a debt summary for the given debt ID.
//    * @param {number} debtId
//    * @returns {Promise<boolean>}
//    */
//   async printReceipt(debtId) {
//     const { AppDataSource } = require("../main/db/data-source");
//     const notificationService = require("./NotificationService");
//     let driver;
//     try {
//       driver = await this._getDriver();
//     } catch (err) {
//       console.error("[PrinterService] No driver available:", err.message);
//       throw new Error("No driver available");
//     }

//     let debt;
//     try {
//       debt = await AppDataSource.getRepository(Debt).findOne({
//         where: { id: debtId },
//         relations: ["borrower", "payments"],
//       });

//       if (!debt) {
//         throw new Error(`Debt with ID ${debtId} not found`);
//       }

//       const receiptText = await this.formatReceipt(debt);
//       await driver.print(receiptText);
//       this.isReady = true;

//       await auditLogger.logCreate(
//         "PrinterEvent",
//         debt.id,
//         { action: "printReceipt" },
//         "system",
//       );
//       console.log(`[PrinterService] Printed debt summary #${debt.id}`);
//       return true;
//     } catch (err) {
//       console.error("[PrinterService] Failed to print receipt:", err.message);
//       this.isReady = false;

//       try {
//         await notificationService.create(
//           {
//             userId: 1,
//             title: "Printer Error",
//             message: `Failed to print receipt: ${err.message}`,
//             type: "error",
//             metadata: { error: err.message },
//           },
//           "system",
//         );
//       } catch (notifErr) {
//         logger.error("Failed to send printer error notification", notifErr);
//       }

//       throw err;
//     }
//   }

//   /**
//    * Format debt summary text including the configurable footer.
//    * @param {any} debt
//    * @returns {Promise<string>}
//    */
//   async formatReceipt(debt) {
//     const storeName = await companyName();
//     const storeLocation = await companyLocation();
//     const footer = await receiptFooterMessage();

//     const paymentsText = debt.payments
//       .map(
//         (p) =>
//           `${p.paymentDate.toISOString().split("T")[0]} - ${p.amount} (${p.method || "cash"})`,
//       )
//       .join("\n");

//     const receipt = `
//       ${storeName}
//       Address: ${storeLocation}
//       -------------------------
//       DEBT #${debt.id} - ${debt.borrower.name}
//       -------------------------
//       Amount: ${debt.amount}
//       Interest: ${debt.interestRate}%
//       Due: ${debt.dueDate}
//       -------------------------
//       Payments:
// ${paymentsText}
//       -------------------------
//       Status: ${debt.status}
//       ${footer}
//       Thank you!
//     `;

//     return receipt.replace(/^\s+/gm, "").trim();
//   }

//   getStatus() {
//     return {
//       driverLoaded: !!this.driver,
//       isReady: this.isReady,
//     };
//   }

//   isAvailable() {
//     return !!this.driver;
//   }
// }

// module.exports = PrinterService;