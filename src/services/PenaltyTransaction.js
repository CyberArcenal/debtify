// services/PenaltyTransactionService.js

const auditLogger = require("../utils/auditLogger");
const { validatePenaltyData } = require("../utils/penaltyUtils");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
class PenaltyTransactionService {
  constructor() {
    this.penaltyRepository = null;
    this.debtRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const Debt = require("../entities/Debt");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.penaltyRepository = AppDataSource.getRepository(PenaltyTransaction);
    this.debtRepository = AppDataSource.getRepository(Debt);
    console.log("PenaltyTransactionService initialized");
  }

  async getRepositories() {
    if (!this.penaltyRepository) {
      await this.initialize();
    }
    return {
      penalty: this.penaltyRepository,
      debt: this.debtRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository<any>}
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
   * Create a new penalty transaction
   * @param {Object} penaltyData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(penaltyData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const penaltyRepo = this._getRepo(qr, PenaltyTransaction);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const validation = validatePenaltyData(penaltyData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const { amount, penaltyDate, reason, debtId } = penaltyData;

      // Validate debt existence
      const debt = await debtRepo.findOne({ where: { id: debtId } });
      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      const penalty = penaltyRepo.create({
        amount: parseFloat(amount),
        penaltyDate: new Date(penaltyDate),
        reason: reason || null,
        createdAt: new Date(),
        debt,
      });

      const saved = await saveDb(penaltyRepo, penalty, { queryRunner: qr });
      await auditLogger.logCreate("PenaltyTransaction", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create penalty:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing penalty transaction
   * @param {number} id
   * @param {Object} penaltyData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async update(id, penaltyData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const penaltyRepo = this._getRepo(qr, PenaltyTransaction);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const existing = await penaltyRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!existing) {
        throw new Error(`Penalty transaction with ID ${id} not found`);
      }
      const oldData = { ...existing };

      // If debtId is being updated, validate new debt
      if (penaltyData.debtId && penaltyData.debtId !== existing.debt.id) {
        const newDebt = await debtRepo.findOne({
          where: { id: penaltyData.debtId },
        });
        if (!newDebt) {
          throw new Error(`Debt with ID ${penaltyData.debtId} not found`);
        }
        existing.debt = newDebt;
        delete penaltyData.debtId;
      }

      // Apply updates
      if (penaltyData.amount !== undefined) {
        penaltyData.amount = parseFloat(penaltyData.amount);
      }
      if (penaltyData.penaltyDate) {
        penaltyData.penaltyDate = new Date(penaltyData.penaltyDate);
      }
      Object.assign(existing, penaltyData);

      const saved = await updateDb(penaltyRepo, existing, { queryRunner: qr });
      await auditLogger.logUpdate(
        "PenaltyTransaction",
        id,
        oldData,
        saved,
        user,
      );
      return saved;
    } catch (error) {
      console.error("Failed to update penalty:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a penalty transaction (set deletedAt)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const penaltyRepo = this._getRepo(qr, PenaltyTransaction);

    try {
      const penalty = await penaltyRepo.findOne({ where: { id } });
      if (!penalty) {
        throw new Error(`Penalty transaction with ID ${id} not found`);
      }
      if (penalty.deletedAt) {
        throw new Error(`Penalty #${id} is already deleted`);
      }

      const oldData = { ...penalty };
      penalty.deletedAt = new Date();

      const saved = await updateDb(penaltyRepo, penalty, { queryRunner: qr });
      await auditLogger.logDelete("PenaltyTransaction", id, oldData, user);
      console.log(`Penalty transaction soft deleted: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to delete penalty:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted penalty transaction
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const penaltyRepo = this._getRepo(qr, PenaltyTransaction);

    try {
      const penalty = await penaltyRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!penalty) {
        throw new Error(`Penalty transaction with ID ${id} not found`);
      }
      if (!penalty.deletedAt) {
        throw new Error(`Penalty #${id} is not deleted`);
      }

      penalty.deletedAt = null;

      const saved = await updateDb(penaltyRepo, penalty, { queryRunner: qr });
      await auditLogger.logUpdate(
        "PenaltyTransaction",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Penalty transaction restored: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to restore penalty:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a penalty transaction
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const penaltyRepo = this._getRepo(qr, PenaltyTransaction);

    const penalty = await penaltyRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!penalty) {
      throw new Error(`Penalty transaction with ID ${id} not found`);
    }

    await removeDb(penaltyRepo, penalty);
    await auditLogger.logDelete("PenaltyTransaction", id, penalty, user);
    console.log(`Penalty #${id} permanently deleted`);
  }

  /**
   * Find penalty by ID (excludes soft-deleted by default)
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { penalty: penaltyRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt", "debt.borrower"] };
    if (!includeDeleted) {
      options.where.deletedAt = null;
    }
    const penalty = await penaltyRepo.findOne(options);
    if (!penalty) {
      throw new Error(`Penalty transaction with ID ${id} not found`);
    }
    await auditLogger.logView("PenaltyTransaction", id, "system");
    return penalty;
  }

  /**
   * Find all penalty transactions with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { penalty: penaltyRepo } = await this.getRepositories();
    const qb = penaltyRepo
      .createQueryBuilder("penalty")
      .leftJoinAndSelect("penalty.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // Exclude soft-deleted unless requested
    if (!options.includeDeleted) {
      qb.andWhere("penalty.deletedAt IS NULL");
    }

    // Filters
    if (options.debtId) {
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    }
    if (options.borrowerId) {
      qb.andWhere("borrower.id = :borrowerId", {
        borrowerId: options.borrowerId,
      });
    }
    if (options.penaltyDateFrom) {
      qb.andWhere("penalty.penaltyDate >= :penaltyDateFrom", {
        penaltyDateFrom: new Date(options.penaltyDateFrom),
      });
    }
    if (options.penaltyDateTo) {
      qb.andWhere("penalty.penaltyDate <= :penaltyDateTo", {
        penaltyDateTo: new Date(options.penaltyDateTo),
      });
    }
    if (options.minAmount) {
      qb.andWhere("penalty.amount >= :minAmount", {
        minAmount: options.minAmount,
      });
    }
    if (options.maxAmount) {
      qb.andWhere("penalty.amount <= :maxAmount", {
        maxAmount: options.maxAmount,
      });
    }
    if (options.reason) {
      qb.andWhere("penalty.reason LIKE :reason", {
        reason: `%${options.reason}%`,
      });
    }
    if (options.search) {
      qb.andWhere(
        "(penalty.reason LIKE :search OR debt.name LIKE :search OR borrower.name LIKE :search)",
        { search: `%${options.search}%` },
      );
    }

    // Sorting
    const sortBy = options.sortBy || "penaltyDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`penalty.${sortBy}`, sortOrder);

    const result = await paginateQueryBuilder(qb, {
      page: options.page,
      limit: options.limit,
    });

    await auditLogger.logView("PenaltyTransaction", null, "system");
    return result; // { data: [], pagination: {} }

    // Pagination
    // if (options.page && options.limit) {
    //   const offset = (options.page - 1) * options.limit;
    //   qb.skip(offset).take(options.limit);
    // }

    // const penalties = await qb.getMany();
    // await auditLogger.logView("PenaltyTransaction", null, "system");
    // return penalties;
  }

  /**
   * Get penalty statistics
   */
  async getStatistics() {
    const { penalty: penaltyRepo } = await this.getRepositories();
    const qb = penaltyRepo
      .createQueryBuilder("penalty")
      .where("penalty.deletedAt IS NULL");

    const totalPenalties = await qb.getCount();
    const totalAmount = await qb
      .clone()
      .select("SUM(penalty.amount)", "sum")
      .getRawOne();
    const averageAmount = await qb
      .clone()
      .select("AVG(penalty.amount)", "avg")
      .getRawOne();

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPenalties = await qb
      .clone()
      .andWhere("penalty.penaltyDate >= :thirtyDaysAgo", { thirtyDaysAgo })
      .getCount();

    // Penalties per debt (top 5)
    const topDebts = await qb
      .clone()
      .select("debt.id", "debtId")
      .addSelect("debt.name", "debtName")
      .addSelect("SUM(penalty.amount)", "totalPenalty")
      .leftJoin("penalty.debt", "debt")
      .groupBy("debt.id")
      .addGroupBy("debt.name")
      .orderBy("totalPenalty", "DESC")
      .limit(5)
      .getRawMany();

    return {
      totalPenalties,
      totalPenaltyAmount: parseFloat(totalAmount?.sum) || 0,
      averagePenaltyAmount: parseFloat(averageAmount?.avg) || 0,
      penaltiesLast30Days: recentPenalties,
      topDebtsByPenalty: topDebts,
    };
  }

  /**
   * Get total penalties for a specific debt
   * @param {number} debtId
   * @param {boolean} includeDeleted
   */
async getTotalPenaltyForDebt(debtId, includeDeleted = false) {
  const result = await this.findAll({ debtId, includeDeleted });
  const penalties = result.data;
  const total = penalties.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  return { debtId, totalPenalty: total, penaltyCount: penalties.length };
}

  /**
   * Export penalties to CSV or JSON
   * @param {string} format
   * @param {Object} filters
   * @param {string} user
   */
  async exportPenalties(format = "json", filters = {}, user = "system") {
     const result = await this.findAll(filters);
  const penalties = result.data;

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Amount",
        "Penalty Date",
        "Reason",
        "Created At",
        "Debt ID",
        "Debt Name",
        "Borrower Name",
      ];
      const rows = penalties.map((p) => [
        p.id,
        p.amount,
        new Date(p.penaltyDate).toLocaleDateString(),
        p.reason || "",
        new Date(p.createdAt).toLocaleString(),
        p.debt?.id ?? "",
        p.debt?.name ?? "",
        p.debt?.borrower?.name ?? "",
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `penalties_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: penalties,
        filename: `penalties_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    await auditLogger.logExport("PenaltyTransaction", format, filters, user);
    console.log(`Exported ${penalties.length} penalties in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create penalties
   * @param {Array<Object>} penaltiesArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkCreate(penaltiesArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of penaltiesArray) {
      try {
        const saved = await this.create(data, user, qr);
        results.created.push(saved);
      } catch (err) {
        results.errors.push({ penalty: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update penalties
   * @param {Array<{ id: number, updates: Object }>} updatesArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        const saved = await this.update(id, updates, user, qr);
        results.updated.push(saved);
      } catch (err) {
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

  /**
   * Import penalties from CSV file
   * @param {string} filePath
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async importFromCSV(filePath, user = "system", qr = null) {
    const fs = require("fs").promises;
    const csv = require("csv-parse/sync");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { imported: [], errors: [] };
    for (const record of records) {
      try {
        const penaltyData = {
          amount: parseFloat(record.amount),
          penaltyDate: record.penaltyDate,
          reason: record.reason || null,
          debtId: parseInt(record.debtId, 10),
        };
        const validation = validatePenaltyData(penaltyData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(penaltyData, user, qr);
        results.imported.push(saved);
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

// Singleton instance
const penaltyTransactionService = new PenaltyTransactionService();
module.exports = penaltyTransactionService;
