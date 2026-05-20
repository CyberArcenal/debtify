// src/subscribers/PrinterSubscriber.js
const Printer = require("../entities/Printer");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PrinterSubscriber");

class PrinterSubscriber {
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
      const { entity } = event;
      logger.info("[PrinterSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PrinterSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PrinterSubscriber] beforeRemove", { id: entity.id });
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