// src/subscribers/PaymentTransactionSubscriber.js
//@ts-check
const  PaymentTransaction  = require("../entities/PaymentTransaction");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PaymentTransactionSubscriber");

class PaymentTransactionSubscriber {
  constructor() {}

  listenTo() {
    return PaymentTransaction;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[PaymentTransactionSubscriber] beforeInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reference: entity.reference,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[PaymentTransactionSubscriber] afterInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reference: entity.reference,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[PaymentTransactionSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[PaymentTransactionSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PaymentTransactionSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[PaymentTransactionSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] afterRemove error", err);
    }
  }
}

module.exports = PaymentTransactionSubscriber;