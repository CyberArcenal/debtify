// src/services/PrinterStateTransitionService.js
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");


class PrinterStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.printerRepo = dataSource.getRepository(require("../entities/Printer"));
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner|null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository}
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    return this.dataSource.getRepository(entityClass);
  }

  async _testAndUpdateStatus(printer, queryRunner = null) {
    const { updateDb, saveDb, removeDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(queryRunner, require("../entities/Printer"));
    const printerService = require("../services/Printer");
    try {
      const result = await printerService.testPrinter(printer.id, "system", queryRunner);
      const success = result && result.success === true;
      printer.status = success ? "online" : "error";
      printer.lastTested = new Date();
      if (!success) {
        logger.warn(`Initial test for printer "${printer.name}" failed.`);
      }
    } catch (err) {
      printer.status = "error";
      printer.lastTested = new Date();
      logger.error(`Printer test failed: ${err.message}`);
    }
    await updateDb(repo, printer);
    return printer.status;
  }

  async onCreated(printer, user = "system", queryRunner = null) {
    const { updateDb, saveDb, removeDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Printer] Printer "${printer.name}" (ID: ${printer.id}) added by ${user}`);
    await this._testAndUpdateStatus(printer, queryRunner);
    await auditLogger.logCreate("Printer", printer.id, printer, user);
  }

  async onUpdate(oldPrinter, newPrinter, user = "system", queryRunner = null) {
    logger.info(`[Printer] Printer "${newPrinter.name}" (ID: ${newPrinter.id}) updated by ${user}`);
    const repo = this._getRepo(queryRunner, require("../entities/Printer"));

    // If connection details changed, re‑test
    if (oldPrinter.interface !== newPrinter.interface || oldPrinter.connectionString !== newPrinter.connectionString) {
      await this._testAndUpdateStatus(newPrinter, queryRunner);
    }

    // Enforce single default if this printer is set as default
    if (!oldPrinter.isDefault && newPrinter.isDefault) {
      const allPrinters = await repo.find({ where: {} });
      for (const p of allPrinters) {
        if (p.id !== newPrinter.id && p.isDefault) {
          p.isDefault = false;
          await updateDb(repo, p);
        }
      }
      // Ensure newPrinter is still default (might have been changed in loop? no)
      newPrinter.isDefault = true;
      await updateDb(repo, newPrinter);
      logger.info(`[Printer] Enforced single default for printer #${newPrinter.id}`);
    } else {
      // No default change, just save the updated printer
      await updateDb(repo, newPrinter);
    }

    await auditLogger.logUpdate("Printer", newPrinter.id, oldPrinter, newPrinter, user);
  }

  async onDelete(printer, user = "system", queryRunner = null) {
    const { updateDb, saveDb, removeDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Printer] Printer "${printer.name}" (ID: ${printer.id}) deleted by ${user}`);
    const repo = this._getRepo(queryRunner, require("../entities/Printer"));

    // If this printer is the default, assign another as default before deletion
    if (printer.isDefault) {
      const another = await repo.findOne({ where: {}, order: { id: "ASC" } });
      if (another && another.id !== printer.id) {
        another.isDefault = true;
        await updateDb(repo, another);
        logger.info(`[Printer] Set printer #${another.id} as new default.`);
      }
    }

    await removeDb(repo, printer);
    await auditLogger.logDelete("Printer", printer.id, printer, user);
  }

  async onTest(printer, success, user = "system", queryRunner = null) {
    const { updateDb, saveDb, removeDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Printer] Test ${success ? "successful" : "failed"} for printer "${printer.name}" (ID: ${printer.id}) by ${user}`);
    const repo = this._getRepo(queryRunner, require("../entities/Printer"));

    const oldStatus = printer.status;
    printer.status = success ? "online" : "error";
    printer.lastTested = new Date();
    await updateDb(repo, printer);

    await auditLogger.logUpdate(
      "Printer",
      printer.id,
      { status: oldStatus },
      { status: printer.status, lastTested: printer.lastTested },
      user
    );
  }
}

module.exports = { PrinterStateTransitionService };