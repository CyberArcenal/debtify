// src/services/PrinterStateTransitionService.js
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");

class PrinterStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.printerRepo = dataSource.getRepository(require("../entities/Printer"));
  }

  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  async _testAndUpdateStatus(printer, queryRunner = null) {
    const repo = this._getRepo(require("../entities/Printer"), queryRunner);
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
    await repo.save(printer);
    return printer.status;
  }

  async onCreated(printer, user = "system", queryRunner = null) {
    logger.info(`[Printer] Printer "${printer.name}" (ID: ${printer.id}) added by ${user}`);
    await this._testAndUpdateStatus(printer, queryRunner);
    await auditLogger.logCreate("Printer", printer.id, printer, user);
  }

  async onUpdate(oldPrinter, newPrinter, user = "system", queryRunner = null) {
    logger.info(`[Printer] Printer "${newPrinter.name}" (ID: ${newPrinter.id}) updated by ${user}`);
    const repo = this._getRepo(require("../entities/Printer"), queryRunner);
    if (oldPrinter.interface !== newPrinter.interface || oldPrinter.connectionString !== newPrinter.connectionString) {
      await this._testAndUpdateStatus(newPrinter, queryRunner);
    }
    if (!oldPrinter.isDefault && newPrinter.isDefault) {
      await repo.update({ isDefault: true, id: newPrinter.id }, { isDefault: false });
      newPrinter.isDefault = true;
      await repo.save(newPrinter);
      logger.info(`[Printer] Enforced single default for printer #${newPrinter.id}`);
    }
    await auditLogger.logUpdate("Printer", newPrinter.id, oldPrinter, newPrinter, user);
  }

  async onDelete(printer, user = "system", queryRunner = null) {
    logger.info(`[Printer] Printer "${printer.name}" (ID: ${printer.id}) deleted by ${user}`);
    const repo = this._getRepo(require("../entities/Printer"), queryRunner);
    if (printer.isDefault) {
      const another = await repo.findOne({ where: {}, order: { id: "ASC" } });
      if (another && another.id !== printer.id) {
        another.isDefault = true;
        await repo.save(another);
        logger.info(`[Printer] Set printer #${another.id} as new default.`);
      }
    }
    await auditLogger.logDelete("Printer", printer.id, printer, user);
  }

  async onTest(printer, success, user = "system", queryRunner = null) {
    logger.info(`[Printer] Test ${success ? "successful" : "failed"} for printer "${printer.name}" (ID: ${printer.id}) by ${user}`);
    const repo = this._getRepo(require("../entities/Printer"), queryRunner);
    printer.status = success ? "online" : "error";
    printer.lastTested = new Date();
    await repo.save(printer);
    await auditLogger.logUpdate("Printer", printer.id, { status: success ? "unknown" : printer.status }, { status: printer.status, lastTested: printer.lastTested }, user);
  }
}

module.exports = { PrinterStateTransitionService };