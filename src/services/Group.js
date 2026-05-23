// src/main/services/GroupService.js
const auditLogger = require("../utils/auditLogger");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");

class GroupService {
  constructor() {
    this.groupRepository = null;
    this.memberRepository = null;
    this.borrowerRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const DebtorGroup = require("../entities/DebtorGroup");
    const DebtorGroupMember = require("../entities/DebtorGroupMember");
    const Borrower = require("../entities/Borrower");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.groupRepository = AppDataSource.getRepository(DebtorGroup);
    this.memberRepository = AppDataSource.getRepository(DebtorGroupMember);
    this.borrowerRepository = AppDataSource.getRepository(Borrower);
    console.log("GroupService initialized");
  }

  async getRepositories() {
    if (!this.groupRepository) {
      await this.initialize();
    }
    return {
      group: this.groupRepository,
      member: this.memberRepository,
      borrower: this.borrowerRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {Function} entityClass
   */
  _getRepo(qr, entityClass) {
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Global._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Global._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Validate group data
   * @param {Object} data
   */
  _validateGroupData(data) {
    const errors = [];
    if (
      !data.name ||
      typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      errors.push("Group name is required");
    }
    return { valid: errors.length === 0, errors };
  }

  // ----------------------------------------------------------------------
  // 📋 READ OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Get all groups with pagination
   * @param {number} page
   * @param {number} limit
   */
  async getAllGroups(page = 1, limit = 10) {
    const { group: groupRepo } = await this.getRepositories();
    const qb = groupRepo.createQueryBuilder("group").orderBy("group.name", "ASC");
    const result = await paginateQueryBuilder(qb, { page, limit });
    await auditLogger.logView("DebtorGroup", null, "system");
    return result;
  }

  /**
   * Get a single group by ID
   * @param {number} id
   */
  async getGroupById(id) {
    const { group: groupRepo } = await this.getRepositories();
    const group = await groupRepo.findOne({ where: { id } });
    if (!group) {
      throw new Error(`Group with ID ${id} not found`);
    }
    await auditLogger.logView("DebtorGroup", id, "system");
    return group;
  }

  /**
   * Get members of a group with pagination (including debtor details)
   * @param {number} groupId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{ data: GroupMemberWithDebtor[], pagination: {...} }>}
   */
  async getGroupMembers(groupId, page = 1, limit = 20) {
    const { member: memberRepo } = await this.getRepositories();
    const qb = memberRepo
      .createQueryBuilder("member")
      .leftJoinAndSelect("member.debtor", "debtor")
      .where("member.groupId = :groupId", { groupId })
      .orderBy("member.assignedAt", "DESC");

    const result = await paginateQueryBuilder(qb, { page, limit });
    // Transform data to match expected interface
    const transformedData = result.data.map((m) => ({
      groupId: m.groupId,
      debtorId: m.debtorId,
      assignedAt: m.assignedAt,
      debtor: {
        id: m.debtor.id,
        name: m.debtor.name,
        contact: m.debtor.contact,
        email: m.debtor.email,
        address: m.debtor.address,
      },
    }));
    return {
      data: transformedData,
      pagination: result.pagination,
    };
  }

  /**
   * Get groups for a specific debtor with pagination
   * @param {number} debtorId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{ data: DebtorGroup[], pagination: {...} }>}
   */
  async getGroupsForDebtor(debtorId, page = 1, limit = 10) {
    const { member: memberRepo } = await this.getRepositories();
    const qb = memberRepo
      .createQueryBuilder("member")
      .leftJoinAndSelect("member.group", "group")
      .where("member.debtorId = :debtorId", { debtorId })
      .orderBy("group.name", "ASC");

    const result = await paginateQueryBuilder(qb, { page, limit });
    const groups = result.data.map((m) => m.group);
    return {
      data: groups,
      pagination: result.pagination,
    };
  }

  // ----------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Create a new group
   * @param {Object} data
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async createGroup(data, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const DebtorGroup = require("../entities/DebtorGroup");
    const groupRepo = this._getRepo(qr, DebtorGroup);

    const validation = this._validateGroupData(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const { name, description = null, color = "#3b82f6" } = data;

    const group = groupRepo.create({
      name: name.trim(),
      description,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await saveDb(groupRepo, group);
    await auditLogger.logCreate("DebtorGroup", saved.id, saved, user);
    console.log(`Group created: ${saved.name} (ID: ${saved.id})`);
    return saved;
  }

  /**
   * Update an existing group
   * @param {number} id
   * @param {Object} data
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async updateGroup(id, data, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const DebtorGroup = require("../entities/DebtorGroup");
    const groupRepo = this._getRepo(qr, DebtorGroup);

    const existing = await groupRepo.findOne({ where: { id } });
    if (!existing) {
      throw new Error(`Group with ID ${id} not found`);
    }
    const oldData = { ...existing };

    if (data.name !== undefined) existing.name = data.name.trim();
    if (data.description !== undefined) existing.description = data.description;
    if (data.color !== undefined) existing.color = data.color;
    existing.updatedAt = new Date();

    const saved = await updateDb(groupRepo, existing);
    await auditLogger.logUpdate("DebtorGroup", id, oldData, saved, user);
    console.log(`Group updated: ${saved.name} (ID: ${saved.id})`);
    return saved;
  }

  /**
   * Delete a group (cascade removes all members)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async deleteGroup(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const DebtorGroup = require("../entities/DebtorGroup");
    const groupRepo = this._getRepo(qr, DebtorGroup);

    const group = await groupRepo.findOne({ where: { id } });
    if (!group) {
      throw new Error(`Group with ID ${id} not found`);
    }

    await removeDb(groupRepo, group);
    await auditLogger.logDelete("DebtorGroup", id, group, user);
    console.log(`Group deleted: ${group.name} (ID: ${group.id})`);
  }

  /**
   * Assign a single debtor to a group
   * @param {number} groupId
   * @param {number} debtorId
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async assignDebtorToGroup(groupId, debtorId, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const DebtorGroupMember = require("../entities/DebtorGroupMember");
    const memberRepo = this._getRepo(qr, DebtorGroupMember);
    const groupRepo = this._getRepo(qr, require("../entities/DebtorGroup"));
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    const group = await groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new Error(`Group with ID ${groupId} not found`);

    const debtor = await borrowerRepo.findOne({ where: { id: debtorId } });
    if (!debtor) throw new Error(`Debtor with ID ${debtorId} not found`);

    const existing = await memberRepo.findOne({
      where: { group: { id: groupId }, debtor: { id: debtorId } },
    });
    if (existing) {
      throw new Error(`Debtor #${debtorId} is already in group #${groupId}`);
    }

    const member = memberRepo.create({
      group,
      debtor,
      assignedAt: new Date(),
    });

    const saved = await saveDb(memberRepo, member);
    await auditLogger.logCreate(
      "DebtorGroupMember",
      saved.id,
      { groupId, debtorId },
      user,
    );
    console.log(`Debtor ${debtorId} assigned to group ${groupId}`);
    return saved;
  }

  /**
   * Bulk assign multiple debtors to a group
   * @param {number} groupId
   * @param {number[]} debtorIds
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkAssignDebtors(groupId, debtorIds, user = "system", qr = null) {
    let assignedCount = 0;
    for (const debtorId of debtorIds) {
      try {
        await this.assignDebtorToGroup(groupId, debtorId, user, qr);
        assignedCount++;
      } catch (err) {
        console.warn(`Failed to assign debtor ${debtorId}: ${err.message}`);
      }
    }
    await auditLogger.logUpdate(
      "DebtorGroup",
      groupId,
      { bulkAssign: true },
      { assignedCount },
      user,
    );
    return { assignedCount };
  }

  /**
   * Remove a debtor from a group
   * @param {number} groupId
   * @param {number} debtorId
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async removeDebtorFromGroup(groupId, debtorId, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const DebtorGroupMember = require("../entities/DebtorGroupMember");
    const memberRepo = this._getRepo(qr, DebtorGroupMember);

    const member = await memberRepo.findOne({
      where: { group: { id: groupId }, debtor: { id: debtorId } },
      relations: ["group", "debtor"],
    });
    if (!member) {
      throw new Error(`Debtor ${debtorId} is not in group ${groupId}`);
    }

    await removeDb(memberRepo, member);
    await auditLogger.logDelete(
      "DebtorGroupMember",
      member.id,
      { groupId, debtorId },
      user,
    );
    console.log(`Debtor ${debtorId} removed from group ${groupId}`);
  }

  /**
   * Clear all members from a group
   * @param {number} groupId
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async clearGroupMembers(groupId, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const DebtorGroupMember = require("../entities/DebtorGroupMember");
    const memberRepo = this._getRepo(qr, DebtorGroupMember);

    const members = await memberRepo.find({
      where: { group: { id: groupId } },
    });
    for (const member of members) {
      await removeDb(memberRepo, member);
    }
    await auditLogger.logUpdate(
      "DebtorGroup",
      groupId,
      { clearMembers: true },
      { removedCount: members.length },
      user,
    );
    console.log(`Cleared ${members.length} members from group ${groupId}`);
  }
}

// Singleton instance
const groupService = new GroupService();
module.exports = groupService;