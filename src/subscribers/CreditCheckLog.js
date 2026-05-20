// src/subscribers/CreditCheckLogSubscriber.js
//@ts-check
const CreditCheckLog = require("../entities/CreditCheckLog");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading CreditCheckLogSubscriber");

class CreditCheckLogSubscriber {
  listenTo() {
    return CreditCheckLog;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[CreditCheckLogSubscriber] beforeInsert", {
        id: entity.id,
        debtorId: entity.debtorId,
        score: entity.score,
        riskLevel: entity.riskLevel,
      });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[CreditCheckLogSubscriber] afterInsert", {
        id: entity.id,
        debtorId: entity.debtorId,
        score: entity.score,
        riskLevel: entity.riskLevel,
      });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[CreditCheckLogSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[CreditCheckLogSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[CreditCheckLogSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[CreditCheckLogSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] afterRemove error", err);
    }
  }
}

module.exports = CreditCheckLogSubscriber;