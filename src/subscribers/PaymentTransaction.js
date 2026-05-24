// src/subscribers/PaymentTransactionSubscriber.js
const PaymentTransaction = require("../entities/PaymentTransaction");
const { logger } = require("../utils/logger");
const { PaymentTransactionStateTransitionService } = require("../StateTransitionServices/PaymentTransaction");

console.log("[Subscriber] Loading PaymentTransactionSubscriber");

class PaymentTransactionSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new PaymentTransactionStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return PaymentTransaction;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentTransactionSubscriber] beforeInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reference: entity.reference,
      });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentTransactionSubscriber] afterInsert", {
        id: entity.id,
        amount: entity.amount,
        debtId: entity.debt?.id,
        reference: entity.reference,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onConfirm) {
        await service.onConfirm(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentTransactionSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[PaymentTransactionSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (entity.isVoided && !databaseEntity.isVoided) {
        await service.onVoid(entity, "system", queryRunner);
      }
      if (entity.refundAmount && entity.refundAmount > 0) {
        await service.onRefund(entity, entity.refundAmount, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[PaymentTransactionSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[PaymentTransactionSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[PaymentTransactionSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = PaymentTransactionSubscriber;