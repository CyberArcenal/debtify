// src/subscribers/LoanApplicationSubscriber.js
//@ts-check
const LoanApplication = require("../entities/LoanApplication");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading LoanApplicationSubscriber");

class LoanApplicationSubscriber {
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
      const { entity } = event;
      logger.info("[LoanApplicationSubscriber] afterUpdate", { id: entity.id });
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