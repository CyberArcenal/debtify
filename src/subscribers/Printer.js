// src/subscribers/PrinterSubscriber.js
const Printer = require("../entities/Printer");
const { logger } = require("../utils/logger");
const { PrinterStateTransitionService } = require("../StateTransitionServices/Printer");

console.log("[Subscriber] Loading PrinterSubscriber");

class PrinterSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new PrinterStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Printer;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PrinterSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        interface: entity.interface,
        isDefault: entity.isDefault,
      });
    } catch (err) {
      logger.error("[PrinterSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PrinterSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        interface: entity.interface,
        isDefault: entity.isDefault,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onCreated) {
        await service.onCreated(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PrinterSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[PrinterSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PrinterSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[PrinterSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onUpdate) {
        await service.onUpdate(databaseEntity, entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PrinterSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[PrinterSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (service.onDelete) {
        await service.onDelete(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PrinterSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[PrinterSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PrinterSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = PrinterSubscriber;