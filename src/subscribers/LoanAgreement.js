// src/subscribers/LoanAgreementSubscriber.js
const LoanAgreement = require("../entities/LoanAgreement");
const { logger } = require("../utils/logger");
const { LoanAgreementStateTransitionService } = require("../StateTransitionServices/LoanAgreement");

console.log("[Subscriber] Loading LoanAgreementSubscriber");

class LoanAgreementSubscriber {
  constructor() {
    this.transitionService = null;
  }

  async getTransitionService(dataSource) {
    if (!this.transitionService) {
      this.transitionService = new LoanAgreementStateTransitionService(dataSource);
    }
    return this.transitionService;
  }

  listenTo() {
    return LoanAgreement;
  }

  async afterInsert(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] afterInsert", {
        id: entity.id,
        lenderName: entity.lenderName,
        debtId: entity.debt?.id,
      });
      const service = await this.getTransitionService(manager.connection);
      await service.onCreated(entity, "system", queryRunner);
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterInsert error", err);
      throw err;
    }
  }

async afterUpdate(event, { manager, queryRunner }) {
  try {
    const { entity, databaseEntity } = event;
    logger.info("[LoanAgreementSubscriber] afterUpdate", { id: entity.id });
    const service = await this.getTransitionService(manager.connection);
    
    // ✅ Check if status changed from draft to signed
    if (databaseEntity.status === "draft" && entity.status === "signed") {
      await service.onSigned(entity, "system", queryRunner);
    } else {
      // For other updates (if any), call onUpdated (optional)
      await service.onUpdated(databaseEntity, entity, "system", queryRunner);
    }
  } catch (err) {
    logger.error("[LoanAgreementSubscriber] afterUpdate error", err);
    throw err;
  }
}

  async beforeRemove(entity, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeRemove", { id: entity.id });
      const service = await this.getTransitionService(manager.connection);
      await service.onBeforeDelete(entity, "system", queryRunner);
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeRemove error", err);
      throw err;
    }
  }

  async afterRemove(event, { manager, queryRunner }) {
    try {
      logger.info("[LoanAgreementSubscriber] afterRemove", { id: event.entityId });
      const service = await this.getTransitionService(manager.connection);
      // You may need to fetch the deleted entity details; for now pass null or a stub
      await service.onAfterDelete({ id: event.entityId }, "system", queryRunner);
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterRemove error", err);
      throw err;
    }
  }

  // ... other lifecycle methods (beforeInsert, beforeUpdate) remain unchanged
}

module.exports = LoanAgreementSubscriber;