// src/main/services/PrinterService.js
const auditLogger = require("../utils/auditLogger");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const Debt = require("../entities/Debt");
const PaymentTransaction = require("../entities/PaymentTransaction");
const {
  companyName,
  receiptFooterMessage,
} = require("../utils/system");
const { logger } = require("../utils/logger");

class PrinterService {
  constructor() {
    // Configuration management properties
    this.printerRepository = null;
    // Receipt printing properties
    this.driver = null;
    this.isReady = false;
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
   * @param {{ manager: { getRepository: (arg0: any) => any; }; } | null} qr
   * @param {string | Function | import("typeorm").EntitySchema<{ id: unknown; name: unknown; description: unknown; interface: unknown; connectionString: unknown; isDefault: unknown; status: unknown; lastTested: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").EntitySchema<import("typeorm").ObjectLiteral> | { type: import("typeorm").ObjectLiteral; name: string; }} entityClass
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  // ----------------------------------------------------------------------
  // CONFIGURATION MANAGEMENT (CRUD, default, test, status)
  // ----------------------------------------------------------------------

  /**
   * @param {{ name: string | undefined; interface: string | undefined; connectionString: undefined; }} data
   */
  _validatePrinterData(data, isUpdate = false) {
    const errors = [];
    if (!isUpdate || data.name !== undefined) {
      if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
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
    const defaultPrinters = await printerRepo.find({ where: { isDefault: true } });
    for (const printer of defaultPrinters) {
      if (printer.id !== excludeId) {
        printer.isDefault = false;
        await printerRepo.save(printer);
      }
    }
  }

  async getAllPrinters() {
    const { printer: repo } = await this.getRepositories();
    const printers = await repo.find({ order: { isDefault: "DESC", name: "ASC" } });
    await auditLogger.logView("Printer", null, "system");
    return printers;
  }

  /**
   * @param {null | undefined} id
   */
  async getPrinterById(id) {
    const { printer: repo } = await this.getRepositories();
    const printer = await repo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);
    await auditLogger.logView("Printer", id, "system");
    return printer;
  }

  /**
   * @param {{ name: any; description?: null | undefined; interface: any; connectionString: any; isDefault?: false | undefined; }} data
   */
  async createPrinter(data, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const validation = this._validatePrinterData(data);
    if (!validation.valid) throw new Error(validation.errors.join(", "));

    const { name, description = null, interface: iface, connectionString, isDefault = false } = data;

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

  /**
   * @param {any} id
   * @param {{ name: string | undefined; description: undefined; interface: undefined; connectionString: undefined; isDefault: undefined; }} data
   */
  async updatePrinter(id, data, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const existing = await printerRepo.findOne({ where: { id } });
    if (!existing) throw new Error(`Printer with ID ${id} not found`);
    const oldData = { ...existing };

    if (data.name !== undefined) existing.name = data.name.trim();
    if (data.description !== undefined) existing.description = data.description;
    if (data.interface !== undefined) existing.interface = data.interface;
    if (data.connectionString !== undefined) existing.connectionString = data.connectionString;
    if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
    existing.updatedAt = new Date();

    const saved = await updateDb(printerRepo, existing);
    if (saved.isDefault) await this._ensureSingleDefault(saved.id, qr);
    await auditLogger.logUpdate("Printer", id, oldData, saved, user);
    return saved;
  }

  /**
   * @param {null | undefined} id
   */
  async setDefaultPrinter(id, user = "system", qr = null) {
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);
    await this._ensureSingleDefault(id, qr);
    printer.isDefault = true;
    printer.updatedAt = new Date();
    const saved = await printerRepo.save(printer);
    await auditLogger.logUpdate("Printer", id, { isDefault: false }, { isDefault: true }, user);
    return saved;
  }

  /**
   * @param {any} id
   */
  async deletePrinter(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);
    if (printer.isDefault) throw new Error("Cannot delete the default printer");
    await removeDb(printerRepo, printer);
    await auditLogger.logDelete("Printer", id, printer, user);
    console.log(`Printer deleted: ${printer.name}`);
  }

  /**
   * @param {any} id
   */
  async refreshPrinterStatus(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
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
    await auditLogger.logUpdate("Printer", id, {}, { status: saved.status }, user);
    return saved;
  }

  // ----------------------------------------------------------------------
  // TEST PRINT (raw content) – used for testing connection
  // ----------------------------------------------------------------------

  /**
   * @param {{ interface: string; connectionString: { split: (arg0: string) => [any, any]; }; name: any; }} printer
   */
  async _sendRawTestPrint(printer) {
    const testContent = "Debtify Test Print\n";
    const timestamp = new Date().toLocaleString();
    const fullContent = `${testContent}Printed: ${timestamp}\n------------------------\nIf you see this, your printer is working correctly.\n`;

    if (printer.interface === "network") {
      const net = require("net");
      const [host, port] = printer.connectionString.split(":");
      return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.connect(parseInt(port), host, () => {
          client.write(fullContent);
          client.end();
          resolve(true);
        });
        client.on("error", (err) => reject(new Error(`Network printer error: ${err.message}`)));
        setTimeout(() => {
          client.destroy();
          reject(new Error("Network printer timeout"));
        }, 5000);
      });
    } else if (printer.interface === "usb") {
      if (process.platform === "win32") {
        const tempFile = require("path").join(require("os").tmpdir(), `debtify_test_${Date.now()}.txt`);
        const fs = require("fs");
        fs.writeFileSync(tempFile, fullContent);
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
        const tempFile = require("path").join(require("os").tmpdir(), `debtify_test_${Date.now()}.txt`);
        const fs = require("fs");
        fs.writeFileSync(tempFile, fullContent);
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
        const tempFile = require("path").join(require("os").tmpdir(), `debtify_test_${Date.now()}.txt`);
        const fs = require("fs");
        fs.writeFileSync(tempFile, fullContent);
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

  /**
   * @param {any} id
   */
  async testPrinter(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Printer = require("../entities/Printer");
    const printerRepo = this._getRepo(qr, Printer);

    const printer = await printerRepo.findOne({ where: { id } });
    if (!printer) throw new Error(`Printer with ID ${id} not found`);

    try {
      await this._sendRawTestPrint(printer);
      printer.status = "online";
      printer.lastTested = new Date();
      printer.updatedAt = new Date();
      await updateDb(printerRepo, printer);
      await auditLogger.logUpdate("Printer", id, { status: "unknown" }, { status: "online" }, user);
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
  // RECEIPT PRINTING (using driver abstraction)
  // ----------------------------------------------------------------------

  /**
   * @param {string} type
   */
  async _loadDriver(type) {
    switch (type.toLowerCase()) {
      case "thermal":
        const ThermalDriver = require("../drivers/thermalDriver");
        return new ThermalDriver();
      case "dot_matrix":
        console.warn("[PrinterService] Dot matrix driver not implemented, falling back to thermal");
        const FallbackThermal = require("../drivers/thermalDriver");
        return new FallbackThermal();
      case "laser":
        console.warn("[PrinterService] Laser printer driver not implemented, falling back to thermal");
        const FallbackThermal2 = require("../drivers/thermalDriver");
        return new FallbackThermal2();
      default:
        throw new Error(`Unsupported printer type: ${type}`);
    }
  }

  async _getDriver() {
    if (!this.driver) {
      const type = "thermal"
      this.driver = await this._loadDriver(type);
    }
    return this.driver;
  }

  /**
   * @param {{ id: string; saleItems: { product: { name: string; }; quantity: number; lineTotal: number; }[]; totalAmount: number; paymentMethod: string; }} debtId
   */
  async printReceipt(debtId) {
    const { AppDataSource } = require("../main/db/data-source");
    const notificationService = require("../services/Notification");
    let driver;
    try {
      driver = await this._getDriver();
    } catch (err) {
      console.error("[PrinterService] No driver available:", err.message);
      throw new Error("No driver available");
    }

    let debt;
    try {
      debt = await AppDataSource.getRepository(Debt).findOne({
        where: { id: debtId },
        relations: ["borrower", "payments"],
      });
      if (!debt) throw new Error(`Debt with ID ${debtId} not found`);

      const receiptText = await this.formatReceipt(debt);
      await driver.print(receiptText);
      this.isReady = true;

      await auditLogger.logCreate("PrinterEvent", debt.id, { action: "printReceipt" }, "system");
      console.log(`[PrinterService] Printed debt summary #${debt.id}`);
      return true;
    } catch (err) {
      console.error("[PrinterService] Failed to print receipt:", err.message);
      this.isReady = false;

      try {
        await notificationService.create(
          {
            userId: 1,
            title: "Printer Error",
            message: `Failed to print receipt: ${err.message}`,
            type: "error",
            metadata: { error: err.message },
          },
          "system"
        );
      } catch (notifErr) {
        logger.error("Failed to send printer error notification", notifErr);
      }
      throw err;
    }
  }

  /**
   * @param {{ id: any; name?: any; totalAmount?: any; paidAmount?: any; remainingAmount?: any; dueDate: any; status: any; interestRate: any; penaltyRate?: any; deletedAt?: any; createdAt?: any; updatedAt?: any; payments?: any; borrower?: any; amount?: any; }} debt
   */
  async formatReceipt(debt) {
    const storeName = await companyName();
    const footer = await receiptFooterMessage();

    const paymentsText = (debt.payments || [])
      .map(
        (/** @type {{ paymentDate: { toISOString: () => string; }; amount: any; method: any; }} */ p) =>
          `${p.paymentDate.toISOString().split("T")[0]} - ${p.amount} (${p.method || "cash"})`
      )
      .join("\n");

    const receipt = `
      ${storeName}
      -------------------------
      DEBT #${debt.id} - ${debt.borrower.name}
      -------------------------
      Amount: ${debt.amount}
      Interest: ${debt.interestRate}%
      Due: ${debt.dueDate}
      -------------------------
      Payments:
${paymentsText}
      -------------------------
      Status: ${debt.status}
      ${footer}
      Thank you!
    `;
    return receipt.replace(/^\s+/gm, "").trim();
  }

  getStatus() {
    return {
      driverLoaded: !!this.driver,
      isReady: this.isReady,
    };
  }

  isAvailable() {
    return !!this.driver;
  }
}

const printerService = new PrinterService();
module.exports = printerService;