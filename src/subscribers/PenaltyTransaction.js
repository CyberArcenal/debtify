// src/subscribers/PenaltyTransactionSubscriber.js
//@ts-check
const PenaltyTransaction  = require("../entities/PenaltyTransaction");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PenaltyTransactionSubscriber");

class PenaltyTransactionSubscriber {
  constructor() {}

  listenTo() {
    return PenaltyTransaction;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[PenaltyTransactionSubscriber] beforeInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reason: entity.reason,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[PenaltyTransactionSubscriber] afterInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reason: entity.reason,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[PenaltyTransactionSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[PenaltyTransactionSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[PenaltyTransactionSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[PenaltyTransactionSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] afterRemove error", err);
    }
  }
}

module.exports = PenaltyTransactionSubscriber;