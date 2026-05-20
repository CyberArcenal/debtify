// services/PaymentTransactionService.js

const auditLogger = require("../utils/auditLogger");
const { validatePaymentData } = require("../utils/paymentUtils");
const {
  enableEarlyPaymentDiscount,
  earlyPaymentDiscountRate,
} = require("../utils/system");

class PaymentTransactionService {
  constructor() {
    this.paymentRepository = null;
    this.debtRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const Debt = require("../entities/Debt");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.paymentRepository = AppDataSource.getRepository(PaymentTransaction);
    this.debtRepository = AppDataSource.getRepository(Debt);
    console.log("PaymentTransactionService initialized");
  }

  async getRepositories() {
    if (!this.paymentRepository) {
      await this.initialize();
    }
    return {
      payment: this.paymentRepository,
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
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Recalculate debt's paidAmount and remainingAmount from all payments
   * @param {number} debtId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<{ totalPaid: number, remainingAmount: number }>}
   */
  async _recalculateDebtAmounts(debtId, qr = null) {
    const Debt = require("../entities/Debt");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const debtRepo = this._getRepo(qr, Debt);
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    const debt = await debtRepo.findOne({ where: { id: debtId } });
    if (!debt) {
      throw new Error(`Debt with ID ${debtId} not found`);
    }

    // Sum all non-deleted payments
    const payments = await paymentRepo.find({
      where: { debt: { id: debtId }, deletedAt: null },
    });
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const newRemaining = debt.totalAmount - totalPaid;
    const remainingAmount = newRemaining < 0 ? 0 : newRemaining;

    // Update debt if changed
    if (debt.paidAmount !== totalPaid || debt.remainingAmount !== remainingAmount) {
      debt.paidAmount = totalPaid;
      debt.remainingAmount = remainingAmount;
      debt.updatedAt = new Date();
      // Optionally update status to 'paid' if remainingAmount === 0
      if (remainingAmount === 0 && debt.status !== 'paid') {
        debt.status = 'paid';
      } else if (remainingAmount > 0 && debt.status === 'paid') {
        debt.status = 'active';
      }
      await debtRepo.save(debt);
    }

    return { totalPaid, remainingAmount };
  }

  /**
   * Create a new payment transaction
   * @param {Object} paymentData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(paymentData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const validation = validatePaymentData(paymentData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      let { amount, paymentDate, reference, notes, debtId } = paymentData;
      let originalAmount = amount;

      // Validate debt existence and remaining balance
      const debt = await debtRepo.findOne({ where: { id: debtId } });
      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      // Get current remaining amount (considering only non-deleted payments)
      const currentRemaining = debt.totalAmount - debt.paidAmount;
      if (parseFloat(amount) > currentRemaining) {
        throw new Error(`Payment amount (${amount}) exceeds remaining balance (${currentRemaining})`);
      }

      // --- Early Payment Discount Logic ---
      const discountEnabled = await enableEarlyPaymentDiscount();
      if (discountEnabled) {
        const dueDate = new Date(debt.dueDate);
        const paymentDateObj = new Date(paymentDate);
        const isEarly = paymentDateObj < dueDate;
        const isFullPayment = Math.abs(parseFloat(amount) - currentRemaining) < 0.01;

        if (isEarly && isFullPayment) {
          const discountRate = await earlyPaymentDiscountRate();
          if (discountRate > 0) {
            const discountedAmount = currentRemaining * (1 - discountRate / 100);
            amount = parseFloat(discountedAmount.toFixed(2));
            const discountNote = `[Early payment discount ${discountRate}% applied – original amount ${originalAmount}]`;
            notes = notes ? `${discountNote} ${notes}` : discountNote;
            console.log(`Early payment discount applied: original ${originalAmount} → discounted ${amount}`);
          }
        }
      }

      const payment = paymentRepo.create({
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        reference: reference || null,
        notes: notes || null,
        recordedAt: new Date(),
        debt,
      });

      const saved = await saveDb(paymentRepo, payment);

      // Recalculate debt totals
      await this._recalculateDebtAmounts(debtId, qr);

      await auditLogger.logCreate("PaymentTransaction", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create payment:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing payment transaction
   * @param {number} id
   * @param {Object} paymentData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async update(id, paymentData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const existing = await paymentRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!existing) {
        throw new Error(`Payment transaction with ID ${id} not found`);
      }
      const oldData = { ...existing };
      const oldDebtId = existing.debt.id;

      // If debtId is being changed, we need to recalc both old and new debts later
      let newDebtId = null;
      if (paymentData.debtId && paymentData.debtId !== oldDebtId) {
        const newDebt = await debtRepo.findOne({ where: { id: paymentData.debtId } });
        if (!newDebt) {
          throw new Error(`Debt with ID ${paymentData.debtId} not found`);
        }
        existing.debt = newDebt;
        newDebtId = paymentData.debtId;
        delete paymentData.debtId;
      }

      // Apply updates
      if (paymentData.amount !== undefined) {
        paymentData.amount = parseFloat(paymentData.amount);
      }
      if (paymentData.paymentDate) {
        paymentData.paymentDate = new Date(paymentData.paymentDate);
      }
      Object.assign(existing, paymentData);
      existing.updatedAt = new Date();

      // If amount changed, we need to validate against the debt's remaining (including this payment's old amount)
      if (paymentData.amount !== undefined && paymentData.amount !== oldData.amount) {
        const targetDebt = existing.debt;
        // Temporarily revert paidAmount to old state (without this payment)
        const oldTotalPaid = targetDebt.paidAmount;
        const oldRemaining = targetDebt.totalAmount - (oldTotalPaid - oldData.amount);
        if (paymentData.amount > oldRemaining) {
          throw new Error(`New payment amount (${paymentData.amount}) exceeds remaining balance (${oldRemaining}) after considering other payments`);
        }
      }

      const saved = await updateDb(paymentRepo, existing);

      // Recalculate affected debts
      await this._recalculateDebtAmounts(oldDebtId, qr);
      if (newDebtId && newDebtId !== oldDebtId) {
        await this._recalculateDebtAmounts(newDebtId, qr);
      } else if (paymentData.amount !== undefined || paymentData.debtId !== undefined) {
        // Amount changed but same debt
        await this._recalculateDebtAmounts(oldDebtId, qr);
      }

      await auditLogger.logUpdate("PaymentTransaction", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update payment:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a payment transaction
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    try {
      const payment = await paymentRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!payment) {
        throw new Error(`Payment transaction with ID ${id} not found`);
      }
      if (payment.deletedAt) {
        throw new Error(`Payment #${id} is already deleted`);
      }

      const oldData = { ...payment };
      const debtId = payment.debt.id;

      payment.deletedAt = new Date();
      payment.updatedAt = new Date();

      const saved = await updateDb(paymentRepo, payment);

      // Recalculate debt totals (payment removed)
      await this._recalculateDebtAmounts(debtId, qr);

      await auditLogger.logDelete("PaymentTransaction", id, oldData, user);
      console.log(`Payment transaction soft deleted: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to delete payment:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted payment transaction
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    try {
      const payment = await paymentRepo.findOne({
        where: { id },
        withDeleted: true,
        relations: ["debt"],
      });
      if (!payment) {
        throw new Error(`Payment transaction with ID ${id} not found`);
      }
      if (!payment.deletedAt) {
        throw new Error(`Payment #${id} is not deleted`);
      }

      // Validate that restoring this payment does not exceed remaining balance
      const debt = payment.debt;
      const currentPaid = debt.paidAmount;
      const newTotalPaid = currentPaid + payment.amount;
      if (newTotalPaid > debt.totalAmount) {
        throw new Error(`Cannot restore payment of ${payment.amount} - would exceed total debt amount`);
      }

      payment.deletedAt = null;
      payment.updatedAt = new Date();

      const saved = await updateDb(paymentRepo, payment);
      await this._recalculateDebtAmounts(payment.debt.id, qr);

      await auditLogger.logUpdate("PaymentTransaction", id, { deletedAt: true }, { deletedAt: null }, user);
      console.log(`Payment transaction restored: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to restore payment:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a payment transaction
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    const payment = await paymentRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ["debt"],
    });
    if (!payment) {
      throw new Error(`Payment transaction with ID ${id} not found`);
    }
    const debtId = payment.debt.id;

    await removeDb(paymentRepo, payment);
    await this._recalculateDebtAmounts(debtId, qr);
    await auditLogger.logDelete("PaymentTransaction", id, payment, user);
    console.log(`Payment #${id} permanently deleted`);
  }

  /**
   * Find payment by ID (excludes soft-deleted by default)
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { payment: paymentRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt", "debt.borrower"] };
    if (!includeDeleted) {
      options.where.deletedAt = null;
    }
    const payment = await paymentRepo.findOne(options);
    if (!payment) {
      throw new Error(`Payment transaction with ID ${id} not found`);
    }
    await auditLogger.logView("PaymentTransaction", id, "system");
    return payment;
  }

  /**
   * Find all payment transactions with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { payment: paymentRepo } = await this.getRepositories();
    const qb = paymentRepo.createQueryBuilder("payment")
      .leftJoinAndSelect("payment.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // Exclude soft-deleted unless requested
    if (!options.includeDeleted) {
      qb.andWhere("payment.deletedAt IS NULL");
    }

    // Filters
    if (options.debtId) {
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    }
    if (options.borrowerId) {
      qb.andWhere("borrower.id = :borrowerId", { borrowerId: options.borrowerId });
    }
    if (options.reference) {
      qb.andWhere("payment.reference LIKE :reference", { reference: `%${options.reference}%` });
    }
    if (options.paymentDateFrom) {
      qb.andWhere("payment.paymentDate >= :paymentDateFrom", { paymentDateFrom: new Date(options.paymentDateFrom) });
    }
    if (options.paymentDateTo) {
      qb.andWhere("payment.paymentDate <= :paymentDateTo", { paymentDateTo: new Date(options.paymentDateTo) });
    }
    if (options.minAmount) {
      qb.andWhere("payment.amount >= :minAmount", { minAmount: options.minAmount });
    }
    if (options.maxAmount) {
      qb.andWhere("payment.amount <= :maxAmount", { maxAmount: options.maxAmount });
    }
    if (options.search) {
      qb.andWhere(
        "(payment.reference LIKE :search OR payment.notes LIKE :search OR debt.name LIKE :search OR borrower.name LIKE :search)",
        { search: `%${options.search}%` }
      );
    }

    // Sorting
    const sortBy = options.sortBy || "paymentDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`payment.${sortBy}`, sortOrder);

    // Pagination
    if (options.page && options.limit) {
      const offset = (options.page - 1) * options.limit;
      qb.skip(offset).take(options.limit);
    }

    const payments = await qb.getMany();
    await auditLogger.logView("PaymentTransaction", null, "system");
    return payments;
  }

  /**
   * Get payment statistics
   */
  async getStatistics() {
    const { payment: paymentRepo } = await this.getRepositories();
    const qb = paymentRepo.createQueryBuilder("payment")
      .where("payment.deletedAt IS NULL");

    const totalPayments = await qb.getCount();
    const totalAmount = await qb.clone().select("SUM(payment.amount)", "sum").getRawOne();
    const averageAmount = await qb.clone().select("AVG(payment.amount)", "avg").getRawOne();

    // Payments by date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayments = await qb.clone()
      .andWhere("payment.paymentDate >= :thirtyDaysAgo", { thirtyDaysAgo })
      .getCount();

    // Unique debts with payments
    const uniqueDebts = await qb.clone()
      .select("COUNT(DISTINCT payment.debtId)", "count")
      .getRawOne();

    return {
      totalPayments,
      totalAmountCollected: parseFloat(totalAmount?.sum) || 0,
      averagePaymentAmount: parseFloat(averageAmount?.avg) || 0,
      paymentsLast30Days: recentPayments,
      debtsWithPayments: parseInt(uniqueDebts?.count) || 0,
    };
  }

  /**
   * Export payment transactions to CSV or JSON
   * @param {string} format
   * @param {Object} filters
   * @param {string} user
   */
  async exportPayments(format = "json", filters = {}, user = "system") {
    const payments = await this.findAll(filters);

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID", "Amount", "Payment Date", "Reference", "Notes",
        "Recorded At", "Debt ID", "Debt Name", "Borrower Name"
      ];
      const rows = payments.map(p => [
        p.id,
        p.amount,
        new Date(p.paymentDate).toLocaleDateString(),
        p.reference || "",
        (p.notes || "").replace(/,/g, " "),
        new Date(p.recordedAt).toLocaleString(),
        p.debt?.id ?? "",
        p.debt?.name ?? "",
        p.debt?.borrower?.name ?? "",
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map(row => row.join(",")).join("\n"),
        filename: `payments_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: payments,
        filename: `payments_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    await auditLogger.logExport("PaymentTransaction", format, filters, user);
    console.log(`Exported ${payments.length} payments in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create payments
   * @param {Array<Object>} paymentsArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkCreate(paymentsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of paymentsArray) {
      try {
        const saved = await this.create(data, user, qr);
        results.created.push(saved);
      } catch (err) {
        results.errors.push({ payment: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update payments
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
   * Import payments from CSV file
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
        const paymentData = {
          amount: parseFloat(record.amount),
          paymentDate: record.paymentDate,
          reference: record.reference || null,
          notes: record.notes || null,
          debtId: parseInt(record.debtId, 10),
        };
        const validation = validatePaymentData(paymentData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(paymentData, user, qr);
        results.imported.push(saved);
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

// Singleton instance
const paymentTransactionService = new PaymentTransactionService();
module.exports = paymentTransactionService;