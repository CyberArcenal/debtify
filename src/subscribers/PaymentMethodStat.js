// src/subscribers/PaymentMethodStatSubscriber.js
const PaymentMethodStat = require("../entities/PaymentMethodStat");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PaymentMethodStatSubscriber");

class PaymentMethodStatSubscriber {
  listenTo() {
    return PaymentMethodStat;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodStatSubscriber] beforeInsert", {
        id: entity.id,
        methodId: entity.method?.id,
        transactionCount: entity.transactionCount,
      });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodStatSubscriber] afterInsert", {
        id: entity.id,
        methodId: entity.method?.id,
        transactionCount: entity.transactionCount,
      });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodStatSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity } = event;
      logger.info("[PaymentMethodStatSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodStatSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[PaymentMethodStatSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PaymentMethodStatSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = PaymentMethodStatSubscriber;