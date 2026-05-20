// src/subscribers/PaymentMethodSubscriber.js
//@ts-check
const PaymentMethod = require("../entities/PaymentMethod");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PaymentMethodSubscriber");

class PaymentMethodSubscriber {
  listenTo() {
    return PaymentMethod;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        isDefault: entity.isDefault,
      });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        isDefault: entity.isDefault,
      });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[PaymentMethodSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PaymentMethodSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[PaymentMethodSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PaymentMethodSubscriber] afterRemove error", err);
    }
  }
}

module.exports = PaymentMethodSubscriber;