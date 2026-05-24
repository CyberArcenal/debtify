// src/subscribers/CreditCheckLogSubscriber.js
const CreditCheckLog = require("../entities/CreditCheckLog");
const { logger } = require("../utils/logger");
const { CreditCheckStateTransitionService } = require("../StateTransitionServices/CreditCheck");

console.log("[Subscriber] Loading CreditCheckLogSubscriber");

class CreditCheckLogSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new CreditCheckStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return CreditCheckLog;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[CreditCheckLogSubscriber] beforeInsert", {
        id: entity.id,
        debtorId: entity.debtorId,
        score: entity.score,
        riskLevel: entity.riskLevel,
      });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[CreditCheckLogSubscriber] afterInsert", {
        id: entity.id,
        debtorId: entity.debtorId,
        score: entity.score,
        riskLevel: entity.riskLevel,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onCheckPerformed) {
        await service.onCheckPerformed(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[CreditCheckLogSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity } = event;
      logger.info("[CreditCheckLogSubscriber] afterUpdate", { id: entity.id });
      // Usually logs are not updated, but if needed:
      // const service = await this.getTransitionService(manager.connection);
      // if (service.onLogUpdated) await service.onLogUpdated(entity, "system", queryRunner);
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[CreditCheckLogSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[CreditCheckLogSubscriber] afterRemove", { id: event.entityId });
      const service = await this.getTransitionService(manager.connection);
      if (service.onLogDeleted) {
        await service.onLogDeleted({ id: event.entityId }, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[CreditCheckLogSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = CreditCheckLogSubscriber;