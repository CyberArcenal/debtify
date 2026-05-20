// src/subscribers/PaymentMethodStatSubscriber.js
//@ts-check
const PaymentMethodStat = require("../entities/PaymentMethodStat");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PaymentMethodStatSubscriber");

class PaymentMethodStatSubscriber {
  listenTo() {
    return PaymentMethodStat;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[PaymentMethodStatSubscriber] beforeInsert", {
        id: entity.id,
        methodId: entity.method?.id,
        transactionCount: entity.transactionCount,
      });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[PaymentMethodStatSubscriber] afterInsert", {
        id: entity.id,
        methodId: entity.method?.id,
        transactionCount: entity.transactionCount,
      });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[PaymentMethodStatSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[PaymentMethodStatSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PaymentMethodStatSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[PaymentMethodStatSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] afterRemove error", err);
    }
  }
}

module.exports = PaymentMethodStatSubscriber;