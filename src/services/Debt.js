// services/DebtService.js
const auditLogger = require("../utils/auditLogger");
const { validateDebtData } = require("../utils/debtUtils");
const { defaultInterestRate, defaultPenaltyRate } = require("../utils/system");

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
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
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
    const debtRepo = this._getRepo(qr, Debt);
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    try {
      const validation = validateDebtData(debtData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const {
        name,
        totalAmount,
        paidAmount = 0,
        dueDate,
        status = "active",
        interestRate = null,
        penaltyRate = null,
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

      const saved = await saveDb(debtRepo, debt);
      await auditLogger.logCreate("Debt", saved.id, saved, user);
      return saved;
    } catch (error) {
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
    const debtRepo = this._getRepo(qr, Debt);
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    try {
      const existing = await debtRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      const oldData = { ...existing };

      // If borrowerId is being updated, validate new borrower
      if (debtData.borrowerId && debtData.borrowerId !== existing.borrower.id) {
        const newBorrower = await borrowerRepo.findOne({
          where: { id: debtData.borrowerId },
        });
        if (!newBorrower) {
          throw new Error(`Borrower with ID ${debtData.borrowerId} not found`);
        }
        existing.borrower = newBorrower;
        delete debtData.borrowerId;
      }

      // Apply other updates
      Object.assign(existing, debtData);

      // Recalculate remaining amount if totalAmount or paidAmount changed
      if (
        debtData.totalAmount !== undefined ||
        debtData.paidAmount !== undefined
      ) {
        existing.remainingAmount = existing.totalAmount - existing.paidAmount;
      }

      // Ensure dueDate is a Date object
      if (debtData.dueDate) {
        existing.dueDate = new Date(debtData.dueDate);
      }

      existing.updatedAt = new Date();

      const saved = await updateDb(debtRepo, existing);
      await auditLogger.logUpdate("Debt", id, oldData, saved, user);
      return saved;
    } catch (error) {
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

      const saved = await updateDb(debtRepo, debt);
      await auditLogger.logDelete("Debt", id, oldData, user);
      console.log(`Debt soft deleted: #${id}`);
      return saved;
    } catch (error) {
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

      const saved = await updateDb(debtRepo, debt);
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
    const debtRepo = this._getRepo(qr, Debt);

    const debt = await debtRepo.findOne({ where: { id }, withDeleted: true });
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

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
    const debtRepo = this._getRepo(qr, Debt);

    const debt = await debtRepo.findOne({ where: { id } });
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

    const oldRemaining = debt.remainingAmount;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();

    const saved = await updateDb(debtRepo, debt);
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
      options.where.deletedAt = null;
    }
    const debt = await debtRepo.findOne(options);
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }
    await auditLogger.logView("Debt", id, "system");
    return debt;
  }

  /**
   * Find all debts with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { debt: debtRepo } = await this.getRepositories();
    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // Exclude soft-deleted unless requested
    if (!options.includeDeleted) {
      qb.andWhere("debt.deletedAt IS NULL");
    }

    // Filters
    if (options.status) {
      qb.andWhere("debt.status = :status", { status: options.status });
    }
    if (options.borrowerId) {
      qb.andWhere("borrower.id = :borrowerId", {
        borrowerId: options.borrowerId,
      });
    }
    if (options.dueDateFrom) {
      qb.andWhere("debt.dueDate >= :dueDateFrom", {
        dueDateFrom: new Date(options.dueDateFrom),
      });
    }
    if (options.dueDateTo) {
      qb.andWhere("debt.dueDate <= :dueDateTo", {
        dueDateTo: new Date(options.dueDateTo),
      });
    }
    if (options.minTotalAmount) {
      qb.andWhere("debt.totalAmount >= :minTotalAmount", {
        minTotalAmount: options.minTotalAmount,
      });
    }
    if (options.maxTotalAmount) {
      qb.andWhere("debt.totalAmount <= :maxTotalAmount", {
        maxTotalAmount: options.maxTotalAmount,
      });
    }
    if (options.search) {
      qb.andWhere("(debt.name LIKE :search OR borrower.name LIKE :search)", {
        search: `%${options.search}%`,
      });
    }

    // Sorting
    const sortBy = options.sortBy || "dueDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`debt.${sortBy}`, sortOrder);

    // Pagination
    if (options.page && options.limit) {
      const offset = (options.page - 1) * options.limit;
      qb.skip(offset).take(options.limit);
    }

    const debts = await qb.getMany();
    await auditLogger.logView("Debt", null, "system");
    return debts;
  }

  async correctTotalAmount(id, newTotalAmount, user, qr) {
    const existing = await this.findById(id);
    const oldTotal = existing.totalAmount;
    existing.totalAmount = newTotalAmount;
    existing.remainingAmount = existing.totalAmount - existing.paidAmount;
    // I-save na may skipSignal para hindi mag-trigger ng forgiveness
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr, require("../entities/Debt"));
    return await updateDb(repo, existing, { skipSignal: true });
  }

  async applyForgiveness(
    id,
    amountForgiven,
    user = "system",
    reason = null,
    qr = null,
  ) {
    const debt = await this.findById(id);
    if (amountForgiven <= 0)
      throw new Error("Forgiveness amount must be positive");
    if (amountForgiven > debt.totalAmount)
      throw new Error("Cannot forgive more than total amount");

    const oldTotal = debt.totalAmount;
    debt.totalAmount -= amountForgiven;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();

    const saved = await this.update(
      id,
      { totalAmount: debt.totalAmount },
      user,
      qr,
    );
    // Note: subscriber will still detect the change and call onForgiveness.
    // But we also log a specific audit entry.
    await auditLogger.logUpdate(
      "Debt",
      id,
      { forgivenessAmount: amountForgiven, reason },
      { totalAmount: oldTotal, newTotal: debt.totalAmount },
      user,
    );
    return saved;
  }

  /**
   * Get debt statistics
   */
  async getStatistics() {
    const { debt: debtRepo } = await this.getRepositories();
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
    const debts = await this.findAll(filters);

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
        results.created.push(saved);
      } catch (err) {
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
        results.updated.push(saved);
      } catch (err) {
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
          name: record.name,
          totalAmount: parseFloat(record.totalAmount),
          paidAmount: parseFloat(record.paidAmount) || 0,
          dueDate: record.dueDate,
          status: record.status || "active",
          interestRate: record.interestRate
            ? parseFloat(record.interestRate)
            : null,
          penaltyRate: record.penaltyRate
            ? parseFloat(record.penaltyRate)
            : null,
          borrowerId: parseInt(record.borrowerId, 10),
        };
        const validation = validateDebtData(debtData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(debtData, user, qr);
        results.imported.push(saved);
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

// Singleton instance
const debtService = new DebtService();
module.exports = debtService;
