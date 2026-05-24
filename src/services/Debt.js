// services/DebtService.js
const auditLogger = require("../utils/auditLogger");
const { validateDebtData } = require("../utils/debtUtils");
const { defaultInterestRate, defaultPenaltyRate } = require("../utils/system");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
// @ts-ignore
const { logger } = require("../utils/logger");
class DebtService {
  constructor() {
    this.debtRepository = null;
    this.borrowerRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const Debt = require("../entities/Debt");
    const Borrower = require("../entities/Borrower");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.debtRepository = AppDataSource.getRepository(Debt);
    this.borrowerRepository = AppDataSource.getRepository(Borrower);
    console.log("DebtService initialized");
  }

  async getRepositories() {
    if (!this.debtRepository) {
      await this.initialize();
    }
    return {
      debt: this.debtRepository,
      borrower: this.borrowerRepository,
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
      `[DebtService._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[DebtService._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Create a new debt
   * @param {Object} debtData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(debtData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);
    // @ts-ignore
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    try {
      const validation = validateDebtData(debtData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const {
        // @ts-ignore
        name,
        // @ts-ignore
        totalAmount,
        // @ts-ignore
        paidAmount = 0,
        // @ts-ignore
        dueDate,
        // @ts-ignore
        status = "active",
        // @ts-ignore
        interestRate = null,
        // @ts-ignore
        penaltyRate = null,
        // @ts-ignore
        borrowerId,
      } = debtData;

      // Validate borrower existence
      const borrower = await borrowerRepo.findOne({
        where: { id: borrowerId },
      });
      if (!borrower) {
        throw new Error(`Borrower with ID ${borrowerId} not found`);
      }

      // Calculate remaining amount
      const remainingAmount = totalAmount - paidAmount;
      const finalInterestRate =
        interestRate !== null && interestRate !== undefined
          ? parseFloat(interestRate)
          : await defaultInterestRate();
      let finalPenaltyRate =
        penaltyRate !== null && penaltyRate !== undefined
          ? parseFloat(penaltyRate)
          : await defaultPenaltyRate();
      if (isNaN(finalPenaltyRate)) finalPenaltyRate = 0;

      const debt = debtRepo.create({
        name,
        totalAmount,
        paidAmount,
        remainingAmount,
        dueDate: new Date(dueDate),
        status,
        interestRate: finalInterestRate,
        penaltyRate: finalPenaltyRate,
        borrower,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // @ts-ignore
      const saved = await saveDb(debtRepo, debt, { queryRunner: qr });
      await auditLogger.logCreate("Debt", saved.id, saved, user);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create debt:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing debt
   * @param {number} id
   * @param {Object} debtData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async update(id, debtData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);
    // @ts-ignore
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    try {
      const existing = await debtRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      const oldData = { ...existing };

      // If borrowerId is being updated, validate new borrower
      // @ts-ignore
      if (debtData.borrowerId && debtData.borrowerId !== existing.borrower.id) {
        const newBorrower = await borrowerRepo.findOne({
          // @ts-ignore
          where: { id: debtData.borrowerId },
        });
        if (!newBorrower) {
          // @ts-ignore
          throw new Error(`Borrower with ID ${debtData.borrowerId} not found`);
        }
        existing.borrower = newBorrower;
        // @ts-ignore
        delete debtData.borrowerId;
      }

      // Apply other updates
      Object.assign(existing, debtData);

      // Recalculate remaining amount if totalAmount or paidAmount changed
      if (
        // @ts-ignore
        debtData.totalAmount !== undefined ||
        // @ts-ignore
        debtData.paidAmount !== undefined
      ) {
        existing.remainingAmount = existing.totalAmount - existing.paidAmount;
      }

      // Ensure dueDate is a Date object
      // @ts-ignore
      if (debtData.dueDate) {
        // @ts-ignore
        existing.dueDate = new Date(debtData.dueDate);
      }

      existing.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(debtRepo, existing, { queryRunner: qr });
      await auditLogger.logUpdate("Debt", id, oldData, saved, user);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update debt:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a debt (set deletedAt)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    try {
      const debt = await debtRepo.findOne({ where: { id } });
      if (!debt) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      if (debt.deletedAt) {
        throw new Error(`Debt #${id} is already deleted`);
      }

      const oldData = { ...debt };
      debt.deletedAt = new Date();
      debt.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(debtRepo, debt, { queryRunner: qr });
      await auditLogger.logDelete("Debt", id, oldData, user);
      console.log(`Debt soft deleted: #${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete debt:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted debt
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    try {
      const debt = await debtRepo.findOne({ where: { id }, withDeleted: true });
      if (!debt) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      if (!debt.deletedAt) {
        throw new Error(`Debt #${id} is not deleted`);
      }

      debt.deletedAt = null;
      debt.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(debtRepo, debt, { queryRunner: qr });
      await auditLogger.logUpdate(
        "Debt",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Debt restored: #${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to restore debt:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a debt
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    const debt = await debtRepo.findOne({ where: { id }, withDeleted: true });
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

    // @ts-ignore
    await removeDb(debtRepo, debt);
    await auditLogger.logDelete("Debt", id, debt, user);
    console.log(`Debt #${id} permanently deleted`);
  }

  /**
   * Recalculate remaining amount for a debt based on paidAmount
   * Useful after payment transactions
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async recalculateRemainingAmount(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    const debt = await debtRepo.findOne({ where: { id } });
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

    const oldRemaining = debt.remainingAmount;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();

    // @ts-ignore
    const saved = await updateDb(debtRepo, debt, { queryRunner: qr });
    await auditLogger.logUpdate(
      "Debt",
      id,
      { remainingAmount: oldRemaining },
      { remainingAmount: debt.remainingAmount },
      user,
    );
    console.log(
      `Remaining amount recalculated for debt #${id}: ${oldRemaining} → ${debt.remainingAmount}`,
    );
    return saved;
  }

  /**
   * Find debt by ID (excludes soft-deleted by default)
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { debt: debtRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["borrower"] };
    if (!includeDeleted) {
      // @ts-ignore
      options.where.deletedAt = null;
    }
    // @ts-ignore
    const debt = await debtRepo.findOne(options);
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }
    // @ts-ignore
    await auditLogger.logView("Debt", id, "system");
    return debt;
  }

  /**
   * Find all debts with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { debt: debtRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // Exclude soft-deleted unless requested
    // @ts-ignore
    if (!options.includeDeleted) {
      qb.andWhere("debt.deletedAt IS NULL");
    }

    // Filters
    // @ts-ignore
    if (options.status) {
      // @ts-ignore
      qb.andWhere("debt.status = :status", { status: options.status });
    }
    // @ts-ignore
    if (options.borrowerId) {
      qb.andWhere("borrower.id = :borrowerId", {
        // @ts-ignore
        borrowerId: options.borrowerId,
      });
    }
    // @ts-ignore
    if (options.dueDateFrom) {
      qb.andWhere("debt.dueDate >= :dueDateFrom", {
        // @ts-ignore
        dueDateFrom: new Date(options.dueDateFrom),
      });
    }
    // @ts-ignore
    if (options.dueDateTo) {
      qb.andWhere("debt.dueDate <= :dueDateTo", {
        // @ts-ignore
        dueDateTo: new Date(options.dueDateTo),
      });
    }
    // @ts-ignore
    if (options.minTotalAmount) {
      qb.andWhere("debt.totalAmount >= :minTotalAmount", {
        // @ts-ignore
        minTotalAmount: options.minTotalAmount,
      });
    }
    // @ts-ignore
    if (options.maxTotalAmount) {
      qb.andWhere("debt.totalAmount <= :maxTotalAmount", {
        // @ts-ignore
        maxTotalAmount: options.maxTotalAmount,
      });
    }
    // @ts-ignore
    if (options.search) {
      qb.andWhere("(debt.name LIKE :search OR borrower.name LIKE :search)", {
        // @ts-ignore
        search: `%${options.search}%`,
      });
    }

    // Sorting
    // @ts-ignore
    const sortBy = options.sortBy || "dueDate";
    // @ts-ignore
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`debt.${sortBy}`, sortOrder);

    // Pagination
    const result = await paginateQueryBuilder(qb, {
      // @ts-ignore
      page: options.page,
      // @ts-ignore
      limit: options.limit,
    });
    await auditLogger.logView("Debt", null, "system");
    return result;
  }

  // @ts-ignore
  async correctTotalAmount(id, newTotalAmount, user, qr) {
    const existing = await this.findById(id);
    // @ts-ignore
    const oldTotal = existing.totalAmount;
    existing.totalAmount = newTotalAmount;
    // @ts-ignore
    existing.remainingAmount = existing.totalAmount - existing.paidAmount;
    // I-save na may skipSignal para hindi mag-trigger ng forgiveness
    const { updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    const repo = this._getRepo(qr, require("../entities/Debt"));
    // @ts-ignore
    return await updateDb(repo, existing, { queryRunner: qr, skipSignal: true });
  }

  // services/DebtService.js – inside applyForgiveness

  async applyForgiveness(
    // @ts-ignore
    id,
    // @ts-ignore
    amountForgiven,
    user = "system",
    reason = null,
    qr = null,
  ) {
    const debt = await this.findById(id);
    if (amountForgiven <= 0)
      throw new Error("Forgiveness amount must be positive");
    // @ts-ignore
    if (amountForgiven > debt.totalAmount)
      throw new Error("Cannot forgive more than total amount");

    const oldTotal = debt.totalAmount;
    // @ts-ignore
    debt.totalAmount -= amountForgiven;
    // @ts-ignore
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    // @ts-ignore
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();

    const { updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    const repo = this._getRepo(qr, require("../entities/Debt"));
    // @ts-ignore
    await updateDb(repo, debt, { queryRunner: qr, skipSignal: true });

    // ✅ Reload the debt with borrower relation after update
    const refreshedDebt = await this.findById(id); // includes borrower via relations

    const {
      DebtStateTransitionService,
    } = require("../StateTransitionServices/Debt");
    const { AppDataSource } = require("../main/db/data-source");
    const transitionService = new DebtStateTransitionService(AppDataSource);
    await transitionService.onForgiveness(
      refreshedDebt,
      amountForgiven,
      user,
      qr,
      reason,
    );

    await auditLogger.logUpdate(
      "Debt",
      id,
      { forgivenessAmount: amountForgiven, reason },
      { totalAmount: oldTotal, newTotal: debt.totalAmount },
      user,
    );

    return refreshedDebt;
  }

  /**
   * Get debt statistics
   */
  async getStatistics() {
    const { debt: debtRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = debtRepo
      .createQueryBuilder("debt")
      .where("debt.deletedAt IS NULL");

    const totalDebts = await qb.getCount();
    const totalActive = await qb
      .clone()
      .andWhere("debt.status = 'active'")
      .getCount();
    const totalPaid = await qb
      .clone()
      .andWhere("debt.status = 'paid'")
      .getCount();
    const totalOverdue = await qb
      .clone()
      .andWhere("debt.status = 'overdue'")
      .getCount();
    const totalDefaulted = await qb
      .clone()
      .andWhere("debt.status = 'defaulted'")
      .getCount();

    const totalAmountSum = await qb
      .clone()
      .select("SUM(debt.totalAmount)", "sum")
      .getRawOne();
    const totalRemainingSum = await qb
      .clone()
      .select("SUM(debt.remainingAmount)", "sum")
      .getRawOne();

    return {
      totalDebts,
      totalActive,
      totalPaid,
      totalOverdue,
      totalDefaulted,
      totalAmountOwed: parseFloat(totalAmountSum.sum) || 0,
      totalRemainingBalance: parseFloat(totalRemainingSum.sum) || 0,
    };
  }

  /**
   * Export debts to CSV or JSON
   * @param {string} format
   * @param {Object} filters
   * @param {string} user
   */
  async exportDebts(format = "json", filters = {}, user = "system") {
    const results = await this.findAll(filters);
    const debts = results.data;

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Name",
        "Total Amount",
        "Paid Amount",
        "Remaining Amount",
        "Due Date",
        "Status",
        "Interest Rate (%)",
        "Penalty Rate (%)",
        "Borrower ID",
        "Borrower Name",
        "Created At",
        "Updated At",
      ];
      const rows = debts.map((d) => [
        d.id,
        d.name,
        d.totalAmount,
        d.paidAmount,
        d.remainingAmount,
        new Date(d.dueDate).toLocaleDateString(),
        d.status,
        d.interestRate ?? "",
        d.penaltyRate ?? "",
        d.borrower?.id ?? "",
        d.borrower?.name ?? "",
        new Date(d.createdAt).toLocaleDateString(),
        new Date(d.updatedAt).toLocaleDateString(),
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `debts_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: debts,
        filename: `debts_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    // @ts-ignore
    await auditLogger.logExport("Debt", format, filters, user);
    console.log(`Exported ${debts.length} debts in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create debts
   * @param {Array<Object>} debtsArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkCreate(debtsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of debtsArray) {
      try {
        const saved = await this.create(data, user, qr);
        // @ts-ignore
        results.created.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ debt: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update debts
   * @param {Array<{ id: number, updates: Object }>} updatesArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        const saved = await this.update(id, updates, user, qr);
        // @ts-ignore
        results.updated.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

  /**
   * Import debts from CSV file
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
        const debtData = {
          // @ts-ignore
          name: record.name,
          // @ts-ignore
          totalAmount: parseFloat(record.totalAmount),
          // @ts-ignore
          paidAmount: parseFloat(record.paidAmount) || 0,
          // @ts-ignore
          dueDate: record.dueDate,
          // @ts-ignore
          status: record.status || "active",
          // @ts-ignore
          interestRate: record.interestRate
            // @ts-ignore
            ? parseFloat(record.interestRate)
            : null,
          // @ts-ignore
          penaltyRate: record.penaltyRate
            // @ts-ignore
            ? parseFloat(record.penaltyRate)
            : null,
          // @ts-ignore
          borrowerId: parseInt(record.borrowerId, 10),
        };
        const validation = validateDebtData(debtData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(debtData, user, qr);
        // @ts-ignore
        results.imported.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }

  // services/Debt.js

  /**
   * Get aging summary for accounts receivable as of a given date.
   * @param {string} asOfDate - YYYY-MM-DD
   * @returns {Promise<{ asOfDate: string; totalOutstanding: number; buckets: Array<{ range: string; minDays: number; maxDays: number|null; totalAmount: number; count: number; percentage: number }> }>}
   */
  async getAgingSummary(asOfDate) {
    const { debt: debtRepo } = await this.getRepositories();
    // Fetch all active debts (status = 'active', not deleted)
    // @ts-ignore
    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.status = :status", { status: "active" })
      .andWhere("debt.deletedAt IS NULL");
    const debts = await qb.getMany();

    const asOf = new Date(asOfDate);
    asOf.setHours(0, 0, 0, 0);
    const today = asOf; // use given date as reference

    const buckets = [
      {
        range: "0-30 days",
        minDays: 0,
        maxDays: 30,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
      {
        range: "31-60 days",
        minDays: 31,
        maxDays: 60,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
      {
        range: "61-90 days",
        minDays: 61,
        maxDays: 90,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
      {
        range: "90+ days",
        minDays: 91,
        maxDays: null,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
    ];

    for (const debt of debts) {
      // @ts-ignore
      const dueDate = new Date(debt.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      let daysPastDue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysPastDue < 0) daysPastDue = 0;

      let bucketIndex = 0;
      if (daysPastDue <= 30) bucketIndex = 0;
      else if (daysPastDue <= 60) bucketIndex = 1;
      else if (daysPastDue <= 90) bucketIndex = 2;
      else bucketIndex = 3;

      // @ts-ignore
      buckets[bucketIndex].totalAmount += debt.remainingAmount;
      buckets[bucketIndex].count += 1;
      // Do not store full debts here to keep lightweight; for drill-down we have separate endpoint.
    }

    const totalOutstanding = buckets.reduce((sum, b) => sum + b.totalAmount, 0);
    for (const bucket of buckets) {
      bucket.percentage =
        totalOutstanding > 0
          ? (bucket.totalAmount / totalOutstanding) * 100
          : 0;
    }

    return { asOfDate, totalOutstanding, buckets };
  }

  /**
   * Get paginated debts that fall into a specific aging bucket as of a given date.
   * @param {string} bucketRange - e.g., "0-30 days", "31-60 days", "61-90 days", "90+ days"
   * @param {string} asOfDate - YYYY-MM-DD
   * @param {number} page - page number
   * @param {number} limit - items per page
   * @returns {Promise<{ data: Debt[], pagination: {...} }>}
   */
  async getDebtsInBucket(bucketRange, asOfDate, page = 1, limit = 10) {
    const { debt: debtRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.status = :status", { status: "active" })
      .andWhere("debt.deletedAt IS NULL");

    const asOf = new Date(asOfDate);
    asOf.setHours(0, 0, 0, 0);

    // Determine min and max days for the bucket
    let minDays = 0,
      maxDays = null;
    if (bucketRange === "0-30 days") {
      minDays = 0;
      maxDays = 30;
    } else if (bucketRange === "31-60 days") {
      minDays = 31;
      maxDays = 60;
    } else if (bucketRange === "61-90 days") {
      minDays = 61;
      maxDays = 90;
    } else if (bucketRange === "90+ days") {
      minDays = 91;
      maxDays = null;
    } else {
      throw new Error(`Invalid bucket range: ${bucketRange}`);
    }

    // Because we cannot directly filter by computed days in SQL easily without a raw query, we'll fetch all active debts and filter client-side.
    // For large datasets, this is inefficient. Better to use a raw SQL expression:
    // WHERE julianday(?) - julianday(dueDate) BETWEEN ? AND ?
    // But since we already have paginateQueryBuilder, we'll do a subquery or raw SQL.
    // Let's use raw SQL for efficiency.

    // @ts-ignore
    const queryRunner = debtRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    try {
      let whereClause = `debt.status = 'active' AND debt.deletedAt IS NULL`;
      if (maxDays !== null) {
        whereClause += ` AND (julianday(:asOfDate) - julianday(debt.dueDate)) BETWEEN :minDays AND :maxDays`;
      } else {
        whereClause += ` AND (julianday(:asOfDate) - julianday(debt.dueDate)) >= :minDays`;
      }
      const parameters = { asOfDate, minDays, maxDays };
      const debts = await queryRunner.manager
        // @ts-ignore
        .createQueryBuilder(Debt, "debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where(whereClause, parameters)
        .orderBy("debt.dueDate", "ASC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const total = await queryRunner.manager
        // @ts-ignore
        .createQueryBuilder(Debt, "debt")
        .where(whereClause, parameters)
        .getCount();

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };
      return { data: debts, pagination };
    } catch (error) {
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Singleton instance
const debtService = new DebtService();
module.exports = debtService;
