// src/subscribers/DebtSubscriber.js
const Debt = require("../entities/Debt");
const { logger } = require("../utils/logger");

const { AppDataSource } = require("../main/db/data-source");
const { DebtStateTransitionService } = require("../StateTransitionServices/Debt");

console.log("[Subscriber] Loading DebtSubscriber");

class DebtSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new DebtStateTransitionService(AppDataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return Debt;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[DebtSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        totalAmount: entity.totalAmount,
        borrowerId: entity.borrower?.id,
      });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
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
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[DebtSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[DebtSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      // Check if status changed and call appropriate transition
      if (entity.status !== databaseEntity.status) {
        switch (entity.status) {
          case "paid":
            await service.onPaid(entity, "system");
            break;
          case "overdue":
            await service.onOverdue(entity, "system");
            break;
          case "defaulted":
            await service.onDefaulted(entity, "system");
            break;
          default:
            if (databaseEntity.status !== "active" && entity.status === "active") {
              await service.onRestoreToActive(entity, "system");
            }
        }
      }
      // If amount reduced (forgiveness) – could be detected via totalAmount change
      if (entity.totalAmount < databaseEntity.totalAmount) {
        const amountForgiven = databaseEntity.totalAmount - entity.totalAmount;
        await service.onForgiveness(entity, amountForgiven, "system");
      }
    } catch (err) {
      logger.error("[DebtSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[DebtSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[DebtSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[DebtSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[DebtSubscriber] afterRemove error", err);
    }
  }
}

module.exports = DebtSubscriber;