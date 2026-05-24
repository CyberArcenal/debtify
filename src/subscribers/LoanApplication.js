// src/subscribers/LoanApplicationSubscriber.js
const LoanApplication = require("../entities/LoanApplication");
const { logger } = require("../utils/logger");
const { LoanApplicationStateTransitionService } = require("../StateTransitionServices/LoanApplication");

console.log("[Subscriber] Loading LoanApplicationSubscriber");

class LoanApplicationSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new LoanApplicationStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return LoanApplication;
  }

  async beforeInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanApplicationSubscriber] beforeInsert", {
        id: entity.id,
        debtorName: entity.debtorName,
        requestedAmount: entity.requestedAmount,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] beforeInsert error", err);
      throw err;
    }
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanApplicationSubscriber] afterInsert", {
        id: entity.id,
        debtorName: entity.debtorName,
        requestedAmount: entity.requestedAmount,
        status: entity.status,
      });
      const service = await this.getTransitionService(manager.connection);
      if (service.onSubmit) {
        await service.onSubmit(entity, "system", queryRunner);
      }
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] afterInsert error", err);
      throw err;
    }
  }

  async beforeUpdate(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanApplicationSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] beforeUpdate error", err);
      throw err;
    }
  }

  async afterUpdate(event, { manager, queryRunner }) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[LoanApplicationSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      if (entity.status !== databaseEntity.status) {
        switch (entity.status) {
          case "approved":
            await service.onApprove(entity, "system", queryRunner);
            break;
          case "rejected":
            await service.onReject(entity, entity.rejectionReason, "system", queryRunner);
            break;
          case "pending":
            if (databaseEntity.status === "rejected") {
              await service.onReopen(entity, "system", queryRunner);
            }
            break;
        }
      }
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] afterUpdate error", err);
      throw err;
    }
  }

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanApplicationSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[LoanApplicationSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] afterRemove error", err);
      throw err;
    }
  }
}

module.exports = LoanApplicationSubscriber;