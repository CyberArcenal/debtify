// src/subscribers/DebtorGroupMemberSubscriber.js
//@ts-check
const DebtorGroupMember = require("../entities/DebtorGroupMember");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading DebtorGroupMemberSubscriber");

class DebtorGroupMemberSubscriber {
  listenTo() {
    return DebtorGroupMember;
  }

  async beforeInsert(entity) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] beforeInsert", {
        id: entity.id,
        groupId: entity.groupId,
        debtorId: entity.debtorId,
      });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] beforeInsert error", err);
    }
  }

  async afterInsert(entity) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] afterInsert", {
        id: entity.id,
        groupId: entity.groupId,
        debtorId: entity.debtorId,
      });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] afterInsert error", err);
    }
  }

  async beforeUpdate(entity) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] beforeUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] beforeUpdate error", err);
    }
  }

  async afterUpdate(event) {
    try {
      const { entity } = event;
      logger.info("[DebtorGroupMemberSubscriber] afterUpdate", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] afterUpdate error", err);
    }
  }

  async beforeRemove(entity) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] beforeRemove", { id: entity.id });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] beforeRemove error", err);
    }
  }

  async afterRemove(event) {
    try {
      logger.info("[DebtorGroupMemberSubscriber] afterRemove", { id: event.entityId });
    } catch (err) {
      logger.error("[DebtorGroupMemberSubscriber] afterRemove error", err);
    }
  }
}

module.exports = DebtorGroupMemberSubscriber;