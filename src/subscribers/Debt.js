// src/subscribers/DebtSubscriber.js
const Debt = require("../entities/Debt");
const { logger } = require("../utils/logger");
const { DebtStateTransitionService } = require("../StateTransitionServices/Debt");

console.log("[Subscriber] Loading DebtSubscriber");

class DebtSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new DebtStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Debt;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        totalAmount: entity.totalAmount,
        borrowerId: entity.borrower?.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        totalAmount: entity.totalAmount,
        borrowerId: entity.borrower?.id,
      });
      // No specific transition on debt creation yet – can add later
    } catch (err) {
      logger.error("[DebtSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[DebtSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      // Check if status changed and call appropriate transition
      if (entity.status !== databaseEntity.status) {
        switch (entity.status) {
          case "paid":
            await service.onPaid(entity, "system", queryRunner);
            break;
          case "overdue":
            await service.onOverdue(entity, "system", queryRunner);
            break;
          case "defaulted":
            await service.onDefaulted(entity, "system", queryRunner);
            break;
          default:
            if (databaseEntity.status !== "active" && entity.status === "active") {
              await service.onRestoreToActive(entity, "system", queryRunner);
            }
        }
      }
      // If amount reduced (forgiveness) – could be detected via totalAmount change
      if (entity.totalAmount < databaseEntity.totalAmount) {
        const amountForgiven = databaseEntity.totalAmount - entity.totalAmount;
        await service.onForgiveness(entity, amountForgiven, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[DebtSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[DebtSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[DebtSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[DebtSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = DebtSubscriber;