// src/subscribers/LoanApplicationSubscriber.js
//@ts-check
const LoanApplication = require("../entities/LoanApplication");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const { LoanApplicationStateTransitionService } = require("../StateTransitionServices/LoanApplication");

console.log("[Subscriber] Loading LoanApplicationSubscriber");

class LoanApplicationSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService() {
    if (!this.transitionService) {
      this.transitionService = new LoanApplicationStateTransitionService(AppDataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return LoanApplication;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[LoanApplicationSubscriber] beforeInsert", {
        id: entity.id,
        debtorName: entity.debtorName,
        requestedAmount: entity.requestedAmount,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[LoanApplicationSubscriber] afterInsert", {
        id: entity.id,
        debtorName: entity.debtorName,
        requestedAmount: entity.requestedAmount,
        status: entity.status,
      });
      const service = await this.getTransitionService();
      if (service.onSubmit) {
        await service.onSubmit(entity, "system");
      }
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[LoanApplicationSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity, databaseEntity } = event;
      logger.info("[LoanApplicationSubscriber] afterUpdate", { id: entity.id });
      const service = await this.getTransitionService();
      if (entity.status !== databaseEntity.status) {
        switch (entity.status) {
          case "approved":
            await service.onApprove(entity, null, "system");
            break;
          case "rejected":
            await service.onReject(entity, entity.rejectionReason, "system");
            break;
          case "pending":
            if (databaseEntity.status === "rejected") {
              await service.onReopen(entity, "system");
            }
            break;
        }
      }
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[LoanApplicationSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[LoanApplicationSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[LoanApplicationSubscriber] afterRemove error", err);
    }
  }
}

module.exports = LoanApplicationSubscriber;