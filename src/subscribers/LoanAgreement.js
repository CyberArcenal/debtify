// src/subscribers/LoanAgreementSubscriber.js
//@ts-check
const LoanAgreement = require("../entities/LoanAgreement");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading LoanAgreementSubscriber");

class LoanAgreementSubscriber {
  constructor() {}

  listenTo() {
    return LoanAgreement;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeInsert", {
        id: entity.id,
        lenderName: entity.lenderName,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[LoanAgreementSubscriber] afterInsert", {
        id: entity.id,
        lenderName: entity.lenderName,
        debtId: entity.debt?.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[LoanAgreementSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[LoanAgreementSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[LoanAgreementSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      logger.error("[LoanAgreementSubscriber] afterRemove error", err);
    }
  }
}

module.exports = LoanAgreementSubscriber;