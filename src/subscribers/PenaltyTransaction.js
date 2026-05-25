// src/subscribers/PenaltyTransactionSubscriber.js
const PenaltyTransaction = require("../entities/PenaltyTransaction");
const { logger } = require("../utils/logger");
const { PenaltyTransactionStateTransitionService } = require("../StateTransitionServices/PenaltyTransaction");

console.log("[Subscriber] Loading PenaltyTransactionSubscriber");

class PenaltyTransactionSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new PenaltyTransactionStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return PenaltyTransaction;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PenaltyTransactionSubscriber] beforeInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reason: entity.reason,
      });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PenaltyTransactionSubscriber] afterInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reason: entity.reason,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onCollect) {
        await service.onCollect(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[PenaltyTransactionSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[PenaltyTransactionSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (entity.waived && !databaseEntity.waived) {
        await service.onWaive(entity, "Admin action", "system", queryRunner);
      }
      if (entity.reversed && !databaseEntity.reversed) {
        await service.onReverse(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[PenaltyTransactionSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[PenaltyTransactionSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PenaltyTransactionSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = PenaltyTransactionSubscriber;