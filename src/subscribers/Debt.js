// src/subscribers/DebtSubscriber.js
//@ts-check
const Debt = require("../entities/Debt");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading DebtSubscriber");

class DebtSubscriber {
  constructor() {}

  listenTo() {
    return Debt;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[DebtSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        totalAmount: entity.totalAmount,
        borrowerId: entity.borrower?.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[DebtSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        totalAmount: entity.totalAmount,
        borrowerId: entity.borrower?.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[DebtSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[DebtSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[DebtSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[DebtSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] afterRemove error", err);
    }
  }
}

module.exports = DebtSubscriber;