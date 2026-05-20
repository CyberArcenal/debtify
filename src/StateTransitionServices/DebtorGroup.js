// src/services/DebtorGroupStateTransitionService.js
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");

class DebtorGroupStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.groupRepo = dataSource.getRepository(require("../entities/DebtorGroup"));
    this.memberRepo = dataSource.getRepository(require("../entities/DebtorGroupMember"));
  }

  /**
   * After a group is created
   * @param {Object} group
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onCreated(group, user = "system", queryRunner = null) {
    logger.info(`[DebtorGroup] Group "${group.name}" (ID: ${group.id}) created by ${user}`);

    // 1. Log creation in audit log
    await auditLogger.logCreate("DebtorGroup", group.id, group, user);

    // 2. Notify administrators (single‑user: just log)
    logger.info(`[DebtorGroup] Group "${group.name}" created.`);

    // 3. Initialize any group‑level settings (e.g., default interest rate override)
    // For a single‑user offline app, this can be done via system settings with a key prefix.
    // We skip here but can be added later.
  }

  /**
   * Before a group is updated – validate changes
   * @param {Object} oldGroup
   * @param {Object} newGroup
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onBeforeUpdate(oldGroup, newGroup, user = "system", queryRunner = null) {
    logger.info(`[DebtorGroup] Group "${oldGroup.name}" (ID: ${oldGroup.id}) about to be updated by ${user}`);

    // Validate name uniqueness (case‑insensitive)
    if (newGroup.name && newGroup.name !== oldGroup.name) {
      const repo = queryRunner ? queryRunner.manager.getRepository(require("../entities/DebtorGroup")) : this.groupRepo;
      const existing = await repo.findOne({ where: { name: newGroup.name } });
      if (existing && existing.id !== oldGroup.id) {
        throw new Error(`Group name "${newGroup.name}" already exists.`);
      }
    }

    // Prepare audit diff – will be persisted in afterUpdate.
  }

  /**
   * After a group is updated – log changes
   * @param {Object} oldGroup
   * @param {Object} newGroup
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onAfterUpdate(oldGroup, newGroup, user = "system", queryRunner = null) {
    logger.info(`[DebtorGroup] Group "${newGroup.name}" (ID: ${newGroup.id}) updated by ${user}`);

    // 1. Audit log of changes (only changed fields)
    const changes = {};
    if (oldGroup.name !== newGroup.name) changes.name = { old: oldGroup.name, new: newGroup.name };
    if (oldGroup.description !== newGroup.description) changes.description = { old: oldGroup.description, new: newGroup.description };
    if (oldGroup.color !== newGroup.color) changes.color = { old: oldGroup.color, new: newGroup.color };
    if (Object.keys(changes).length > 0) {
      await auditLogger.logUpdate("DebtorGroup", newGroup.id, oldGroup, newGroup, user);
    }

    // 2. If name or color changed, update UI caches – no backend action needed, frontend will reload.

    // 3. Notify members – not required for a single‑user offline app.
  }

  /**
   * Before a group is deleted – check dependencies and warn
   * @param {Object} group
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onBeforeDelete(group, user = "system", queryRunner = null) {
    logger.info(`[DebtorGroup] Group "${group.name}" (ID: ${group.id}) about to be deleted by ${user}`);

    // Check if group has members
    const memberRepo = queryRunner ? queryRunner.manager.getRepository(require("../entities/DebtorGroupMember")) : this.memberRepo;
    const memberCount = await memberRepo.count({ where: { group: { id: group.id } } });
    if (memberCount > 0) {
      logger.warn(`Group "${group.name}" has ${memberCount} members; they will be removed.`);
      // In a UI, you might want to show a confirmation dialog – but this is the backend,
      // so we simply allow deletion (cascade will remove members).
    }

    // Prevent deletion if group is used in active rules (e.g., reports) – we skip for now.
  }

  /**
   * After a group is deleted – final clean‑up
   * @param {Object} group
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onAfterDelete(group, user = "system", queryRunner = null) {
    logger.info(`[DebtorGroup] Group "${group.name}" (ID: ${group.id}) deleted by ${user}`);

    // 1. Memberships are already removed by cascade (ON DELETE CASCADE on the foreign key).

    // 2. Archive or delete group‑based reports – if any report configuration uses this group,
    //    you would need to update those reports. We skip because it's out of scope.

    // 3. Log deletion in audit log
    await auditLogger.logDelete("DebtorGroup", group.id, group, user);
  }
}

module.exports = { DebtorGroupStateTransitionService };