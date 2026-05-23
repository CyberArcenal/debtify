// src/main/services/PrinterService.js
const auditLogger = require("../utils/auditLogger");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const Debt = require("../entities/Debt");
const PaymentTransaction = require("../entities/PaymentTransaction");
const { companyName, receiptFooterMessage } = require("../utils/system");
const { logger } = require("../utils/logger");
const { updateDb, saveDb, removeDb } = require("../utils/dbUtils/dbActions");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
class PrinterService {
  constructor() {
    this.printerRepository = null;
  }

  // ----------------------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------------------

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const Printer = require("../entities/Printer");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.printerRepository = AppDataSource.getRepository(Printer);
    console.log("PrinterService initialized (config + receipt)");
  }

  async getRepositories() {
    if (!this.printerRepository) {
      await this.initialize();
    }
    return { printer: this.printerRepository };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner|null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository}
   */
  _getRepo(qr, entityClass) {
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Global._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Global._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  // ----------------------------------------------------------------------
  // CONFIGURATION MANAGEMENT (CRUD, default, test, status)
  // ----------------------------------------------------------------------

  _validatePrinterData(data, isUpdate = false) {
    const errors = [];
    if (!isUpdate || data.name !== undefined) {
      if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.push("Printer name is required");
      }
    }
    if (!isUpdate || data.interface !== undefined) {
      const validInterfaces = ["usb", "network", "bluetooth"];
      if (data.interface && !validInterfaces.includes(data.interface)) {
        errors.push(`Interface must be one of: ${validInterfaces.join(", ")}`);
      }
    }
    if (!isUpdate || data.connectionString !== undefined) {
      if (data.connectionString && typeof data.connectionString !== "string") {
        errors.push("Connection string must be a string");
      }
    }
    return { valid: errors.length === 0, errors };
  }

  async _ensureSingleDefault(excludeId = null, qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);
    const defaultPrinters = await printerRepo.find({
      where: { isDefault: true },
    });
    for (const printer of defaultPrinters) {
      if (printer.id !== excludeId) {
        printer.isDefault = false;
        printer.updatedAt = new Date();
        await updateDb(printerRepo, printer);
      }
    }
  }

async getAllPrinters(page = 1, limit = 10) {
  const { printer: repo } = await this.getRepositories();
  const qb = repo
    .createQueryBuilder("printer")
    .orderBy("printer.isDefault", "DESC")
    .addOrderBy("printer.name", "ASC");
  const result = await paginateQueryBuilder(qb, { page, limit });
  await auditLogger.logView("Printer", null, "system");
  return result;
}

  async getPrinterById(id) {
    const { printer: repo } = await this.getRepositories();
    const printer = await repo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);
    await auditLogger.logView("Printer", id, "system");
    return printer;
  }

  async getDefaultPrinter() {
    const { printer: repo } = await this.getRepositories();
    const printer = await repo.findOne({ where: { isDefault: true } });
    if (!printer) throw new Error("No default printer configured");
    return printer;
  }

  async createPrinter(data, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const validation = this._validatePrinterData(data);
    if (!validation.valid) throw new Error(validation.errors.join(", "));

    const {
      name,
      description = null,
      interface: iface,
      connectionString,
      isDefault = false,
    } = data;

    const printer = printerRepo.create({
      name: name.trim(),
      description,
      interface: iface,
      connectionString,
      isDefault,
      status: "offline",
      lastTested: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await saveDb(printerRepo, printer);
    if (isDefault) await this._ensureSingleDefault(saved.id, qr);
    await auditLogger.logCreate("Printer", saved.id, saved, user);
    console.log(`Printer created: ${saved.name}`);
    return saved;
  }

  async updatePrinter(id, data, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const existing = await printerRepo.findOne({ where: { id } });
    if (!existing) throw new Error(`Printer with ID ${id} not found`);
    const oldData = { ...existing };

    if (data.name !== undefined) existing.name = data.name.trim();
    if (data.description !== undefined) existing.description = data.description;
    if (data.interface !== undefined) existing.interface = data.interface;
    if (data.connectionString !== undefined)
      existing.connectionString = data.connectionString;
    if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
    existing.updatedAt = new Date();

    const saved = await updateDb(printerRepo, existing);
    if (saved.isDefault) await this._ensureSingleDefault(saved.id, qr);
    await auditLogger.logUpdate("Printer", id, oldData, saved, user);
    return saved;
  }

  async setDefaultPrinter(id, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);
    await this._ensureSingleDefault(id, qr);
    printer.isDefault = true;
    printer.updatedAt = new Date();
    const saved = await updateDb(printerRepo, printer);
    await auditLogger.logUpdate(
      "Printer",
      id,
      { isDefault: false },
      { isDefault: true },
      user,
    );
    return saved;
  }

  async deletePrinter(id, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);
    if (printer.isDefault) throw new Error("Cannot delete the default printer");
    await removeDb(printerRepo, printer);
    await auditLogger.logDelete("Printer", id, printer, user);
    console.log(`Printer deleted: ${printer.name}`);
  }

  async refreshPrinterStatus(id, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);

    try {
      if (printer.interface === "network") {
        const [host, port] = printer.connectionString.split(":");
        const net = require("net");
        await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout(2000);
          socket.on("connect", () => {
            socket.destroy();
            resolve();
          });
          socket.on("timeout", () => {
            socket.destroy();
            reject(new Error("Connection timeout"));
          });
          socket.on("error", reject);
          socket.connect(parseInt(port), host);
        });
        printer.status = "online";
      } else {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (printer.lastTested && new Date(printer.lastTested) > sevenDaysAgo) {
          printer.status = "online";
        } else {
          printer.status = "offline";
        }
      }
    } catch (err) {
      printer.status = "offline";
    }
    printer.updatedAt = new Date();
    const saved = await updateDb(printerRepo, printer);
    await auditLogger.logUpdate(
      "Printer",
      id,
      {},
      { status: saved.status },
      user,
    );
    return saved;
  }

  // ----------------------------------------------------------------------
  // RAW PRINTING (generic send to printer by interface)
  // ----------------------------------------------------------------------

  /**
   * Send raw text to a printer based on its interface and connection string
   * @param {Object} printer - Printer entity
   * @param {string} content - Text content to print
   * @returns {Promise<boolean>}
   */
  async _sendRawPrint(printer, content) {
    if (printer.interface === "network") {
      const net = require("net");
      const [host, port] = printer.connectionString.split(":");
      return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.connect(parseInt(port), host, () => {
          client.write(content);
          client.end();
          resolve(true);
        });
        client.on("error", (err) =>
          reject(new Error(`Network printer error: ${err.message}`)),
        );
        setTimeout(() => {
          client.destroy();
          reject(new Error("Network printer timeout"));
        }, 5000);
      });
    } else if (printer.interface === "usb") {
      if (process.platform === "win32") {
        const tempFile = require("path").join(
          require("os").tmpdir(),
          `debtify_print_${Date.now()}.txt`,
        );
        const fs = require("fs");
        fs.writeFileSync(tempFile, content);
        const command = `notepad /p "${tempFile}"`;
        try {
          await execPromise(command);
          fs.unlinkSync(tempFile);
          return true;
        } catch (err) {
          fs.unlinkSync(tempFile);
          throw new Error(`USB printer error: ${err.message}`);
        }
      } else {
        const tempFile = require("path").join(
          require("os").tmpdir(),
          `debtify_print_${Date.now()}.txt`,
        );
        const fs = require("fs");
        fs.writeFileSync(tempFile, content);
        const command = `lp -d "${printer.name}" "${tempFile}"`;
        try {
          await execPromise(command);
          fs.unlinkSync(tempFile);
          return true;
        } catch (err) {
          fs.unlinkSync(tempFile);
          throw new Error(`USB printer error: ${err.message}`);
        }
      }
    } else if (printer.interface === "bluetooth") {
      if (process.platform === "linux") {
        const tempFile = require("path").join(
          require("os").tmpdir(),
          `debtify_print_${Date.now()}.txt`,
        );
        const fs = require("fs");
        fs.writeFileSync(tempFile, content);
        const command = `lpr -P "${printer.name}" "${tempFile}"`;
        try {
          await execPromise(command);
          fs.unlinkSync(tempFile);
          return true;
        } catch (err) {
          fs.unlinkSync(tempFile);
          throw new Error(`Bluetooth printer error: ${err.message}`);
        }
      } else {
        throw new Error("Bluetooth printing only supported on Linux");
      }
    }
    throw new Error(`Unsupported interface: ${printer.interface}`);
  }

  // ----------------------------------------------------------------------
  // TEST PRINT
  // ----------------------------------------------------------------------

  async testPrinter(id, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);

    const testContent = `Debtify Test Print\n`;
    const timestamp = new Date().toLocaleString();
    const fullContent = `${testContent}Printed: ${timestamp}\n------------------------\nIf you see this, your printer is working correctly.\n`;

    try {
      await this._sendRawPrint(printer, fullContent);
      printer.status = "online";
      printer.lastTested = new Date();
      printer.updatedAt = new Date();
      await updateDb(printerRepo, printer);
      await auditLogger.logUpdate(
        "Printer",
        id,
        { status: "unknown" },
        { status: "online" },
        user,
      );
      console.log(`Test print successful for printer ${printer.name}`);
      return { success: true, message: "Test print sent successfully" };
    } catch (err) {
      printer.status = "error";
      printer.lastTested = new Date();
      printer.updatedAt = new Date();
      await updateDb(printerRepo, printer);
      console.error(`Test print failed for ${printer.name}: ${err.message}`);
      throw new Error(`Test print failed: ${err.message}`);
    }
  }

  // ----------------------------------------------------------------------
  // RECEIPT PRINTING (using default printer)
  // ----------------------------------------------------------------------

  /**
   * Print a receipt for a given debt using the default printer
   * @param {number} debtId
   * @returns {Promise<boolean>}
   */
  async printReceipt(debtId) {
    const { AppDataSource } = require("../main/db/data-source");
    const notificationService = require("../services/Notification");

    // 1. Get default printer
    let defaultPrinter;
    try {
      defaultPrinter = await this.getDefaultPrinter();
    } catch (err) {
      console.error(
        "[PrinterService] No default printer configured:",
        err.message,
      );
      throw new Error(
        "No default printer configured. Please set a default printer in settings.",
      );
    }

    // 2. Fetch debt data
    let debt;
    try {
      debt = await AppDataSource.getRepository(Debt).findOne({
        where: { id: debtId },
        relations: ["borrower", "payments"],
      });
      if (!debt) throw new Error(`Debt with ID ${debtId} not found`);
    } catch (err) {
      console.error("[PrinterService] Failed to fetch debt:", err.message);
      throw err;
    }

    // 3. Format receipt content
    const receiptText = await this.formatReceipt(debt);

    // 4. Send to printer
    try {
      await this._sendRawPrint(defaultPrinter, receiptText);
      // Update printer status to online on success (optional)
      if (defaultPrinter.status !== "online") {
        defaultPrinter.status = "online";
        defaultPrinter.lastTested = new Date();
        defaultPrinter.updatedAt = new Date();
        const printerRepo = this._getRepo(null, require("../entities/Printer"));
        await updateDb(printerRepo, defaultPrinter);
      }
      await auditLogger.logCreate(
        "PrinterEvent",
        debt.id,
        { action: "printReceipt" },
        "system",
      );
      console.log(
        `[PrinterService] Printed debt summary #${debt.id} on printer ${defaultPrinter.name}`,
      );
      return true;
    } catch (err) {
      console.error("[PrinterService] Failed to print receipt:", err.message);
      // Update printer status to error
      defaultPrinter.status = "error";
      defaultPrinter.lastTested = new Date();
      defaultPrinter.updatedAt = new Date();
      const printerRepo = this._getRepo(null, require("../entities/Printer"));
      await updateDb(printerRepo, defaultPrinter);
      // Notify user
      try {
        await notificationService.create(
          {
            userId: 1,
            title: "Printer Error",
            message: `Failed to print receipt for debt #${debtId}: ${err.message}`,
            type: "error",
            metadata: { debtId, error: err.message },
          },
          "system",
        );
      } catch (notifErr) {
        logger.error("Failed to send printer error notification", notifErr);
      }
      throw err;
    }
  }

  /**
   * Format receipt content from debt data
   * @param {Object} debt
   * @returns {Promise<string>}
   */
  async formatReceipt(debt) {
    const storeName = await companyName();
    const footer = await receiptFooterMessage();

    const paymentsText = (debt.payments || [])
      .map(
        (p) =>
          `${new Date(p.paymentDate).toISOString().split("T")[0]} - ${p.amount} (${p.method || "cash"})`,
      )
      .join("\n");

    const receipt = `
${storeName}
-------------------------
DEBT #${debt.id} - ${debt.borrower?.name || "Unknown"}
-------------------------
Total Amount: ${debt.totalAmount}
Paid Amount: ${debt.paidAmount}
Remaining: ${debt.remainingAmount}
Interest Rate: ${debt.interestRate}%
Due Date: ${new Date(debt.dueDate).toLocaleDateString()}
Status: ${debt.status}
-------------------------
Payment History:
${paymentsText || "No payments recorded"}
-------------------------
${footer}
Thank you!
    `;
    return receipt.replace(/^\s+/gm, "").trim();
  }

  getStatus() {
    return {
      hasDefaultPrinter: !!this.printerRepository, // simplified
    };
  }

  isAvailable() {
    return true; // we assume printer service is available if configured
  }
}

const printerService = new PrinterService();
module.exports = printerService;
