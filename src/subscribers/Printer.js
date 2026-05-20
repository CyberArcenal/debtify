// src/subscribers/PrinterSubscriber.js
const Printer = require("../entities/Printer");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const { PrinterStateTransitionService } = require("../StateTransitionServices/Printer");

console.log("[Subscriber] Loading PrinterSubscriber");

class PrinterSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new PrinterStateTransitionService(AppDataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Printer;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[PrinterSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        interface: entity.interface,
        isDefault: entity.isDefault,
      });
    } catch (err) {
      logger.error("[PrinterSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[PrinterSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        interface: entity.interface,
        isDefault: entity.isDefault,
      });
      const service = await this.getTransitionService();
      if (service.onCreated) {
        await service.onCreated(entity, "system");
      }
    } catch (err) {
      logger.error("[PrinterSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[PrinterSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PrinterSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[PrinterSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onUpdate) {
        await service.onUpdate(databaseEntity, entity, "system");
      }
    } catch (err) {
      logger.error("[PrinterSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PrinterSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService();
      if (service.onDelete) {
        await service.onDelete(entity, "system");
      }
    } catch (err) {
      logger.error("[PrinterSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[PrinterSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PrinterSubscriber] afterRemove error", err);
    }
  }
}

module.exports = PrinterSubscriber;