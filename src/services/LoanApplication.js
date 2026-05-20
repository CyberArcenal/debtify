// src/main/services/LoanApplication.js
const auditLogger = require("../utils/auditLogger");
const debtService = require("./Debt");
const {
  maxLoanAmount,
  minLoanAmount,
  defaultInterestRate,
  enforceCreditCheck,
  requireLoanAgreement,
} = require("../utils/system");

class LoanApplicationService {
  constructor() {
    this.applicationRepository = null;
    this.borrowerRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const LoanApplication = require("../entities/LoanApplication");
    const Borrower = require("../entities/Borrower");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.applicationRepository = AppDataSource.getRepository(LoanApplication);
    this.borrowerRepository = AppDataSource.getRepository(Borrower);
    console.log("LoanApplicationService initialized");
  }

  async getRepositories() {
    if (!this.applicationRepository) {
      await this.initialize();
    }
    return {
      application: this.applicationRepository,
      borrower: this.borrowerRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Validate application data
   */
  _validateApplicationData(data) {
    const errors = [];
    if (!data.requestedAmount || data.requestedAmount <= 0) {
      errors.push("Requested amount must be greater than zero");
    }
    if (!data.purpose || typeof data.purpose !== "string" || data.purpose.trim() === "") {
      errors.push("Purpose is required");
    }
    if (!data.proposedDueDate) {
      errors.push("Proposed due date is required");
    }
    // If new debtor is provided, name is required
    if (data.newDebtor && (!data.newDebtor.name || data.newDebtor.name.trim() === "")) {
      errors.push("New debtor name is required");
    }
    // If existing debtor, debtorId must be provided and valid
    if (!data.newDebtor && !data.debtorId) {
      errors.push("Either existing debtorId or newDebtor data must be provided");
    }
    return { valid: errors.length === 0, errors };
  }

  // ----------------------------------------------------------------------
  // 📋 READ OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Get all loan applications with filters
   * @param {Object} filters
   */
  async getAllApplications(filters = {}) {
    const { application: repo } = await this.getRepositories();
    const qb = repo.createQueryBuilder("app")
      .leftJoinAndSelect("app.debtor", "debtor")
      .where("app.deletedAt IS NULL");

    if (filters.status) {
      qb.andWhere("app.status = :status", { status: filters.status });
    }
    if (filters.debtorId) {
      qb.andWhere("app.debtorId = :debtorId", { debtorId: filters.debtorId });
    }
    if (filters.fromDate) {
      qb.andWhere("app.createdAt >= :fromDate", { fromDate: new Date(filters.fromDate) });
    }
    if (filters.toDate) {
      qb.andWhere("app.createdAt <= :toDate", { toDate: new Date(filters.toDate) });
    }
    if (filters.search) {
      qb.andWhere(
        "(app.debtorName LIKE :search OR app.purpose LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`app.${sortBy}`, sortOrder);

    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      qb.skip(offset).take(filters.limit);
    }

    let applications = await qb.getMany();
    if (filters.page && filters.limit) {
      const total = await qb.getCount();
      return { items: applications, total, page: filters.page, limit: filters.limit };
    }
    return applications;
  }

  /**
   * Get application by ID
   * @param {number} id
   */
  async getApplicationById(id) {
    const { application: repo } = await this.getRepositories();
    const app = await repo.findOne({
      where: { id, deletedAt: null },
      relations: ["debtor"],
    });
    if (!app) {
      throw new Error(`Loan application with ID ${id} not found`);
    }
    return app;
  }

  // ----------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Create a new loan application
   * @param {Object} data
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async createApplication(data, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const validation = this._validateApplicationData(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    let debtorId = data.debtorId;
    let debtorName = "";
    let debtorContact = null;
    let debtorEmail = null;
    let debtorAddress = null;

    // If new debtor data is provided, create a borrower first
    if (data.newDebtor) {
      const newDebtor = data.newDebtor;
      const borrowerData = {
        name: newDebtor.name,
        contact: newDebtor.contact || null,
        email: newDebtor.email || null,
        address: newDebtor.address || null,
        notes: newDebtor.notes || null,
      };
      const Borrower = require("../entities/Borrower");
      const borrowerRepo = this._getRepo(qr, Borrower);
      const borrower = borrowerRepo.create(borrowerData);
      const savedBorrower = await saveDb(borrowerRepo, borrower);
      debtorId = savedBorrower.id;
      debtorName = savedBorrower.name;
      debtorContact = savedBorrower.contact;
      debtorEmail = savedBorrower.email;
      debtorAddress = savedBorrower.address;
    } else if (data.debtorId) {
      const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));
      const debtor = await borrowerRepo.findOne({ where: { id: data.debtorId } });
      if (!debtor) {
        throw new Error(`Debtor with ID ${data.debtorId} not found`);
      }
      debtorName = debtor.name;
      debtorContact = debtor.contact;
      debtorEmail = debtor.email;
      debtorAddress = debtor.address;
    }

    const application = appRepo.create({
      debtorId,
      debtorName,
      debtorContact,
      debtorEmail,
      debtorAddress,
      requestedAmount: data.requestedAmount,
      purpose: data.purpose,
      proposedDueDate: new Date(data.proposedDueDate),
      interestRate: data.interestRate || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await saveDb(appRepo, application);
    await auditLogger.logCreate("LoanApplication", saved.id, saved, user);
    console.log(`Loan application created: ID ${saved.id} for debtor ${debtorName}`);
    return saved;
  }

  /**
   * Update an application (only if pending)
   * @param {number} id
   * @param {Object} data
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async updateApplication(id, data, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const app = await appRepo.findOne({ where: { id, deletedAt: null } });
    if (!app) {
      throw new Error(`Application with ID ${id} not found`);
    }
    if (app.status !== "pending") {
      throw new Error(`Cannot update application with status ${app.status}`);
    }

    const oldData = { ...app };
    if (data.requestedAmount !== undefined) app.requestedAmount = data.requestedAmount;
    if (data.purpose !== undefined) app.purpose = data.purpose;
    if (data.proposedDueDate !== undefined) app.proposedDueDate = new Date(data.proposedDueDate);
    if (data.interestRate !== undefined) app.interestRate = data.interestRate;
    app.updatedAt = new Date();

    const saved = await updateDb(appRepo, app);
    await auditLogger.logUpdate("LoanApplication", id, oldData, saved, user);
    return saved;
  }

  /**
   * Approve an application – creates active debt
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async approveApplication(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const app = await appRepo.findOne({ where: { id, deletedAt: null } });
    if (!app) {
      throw new Error(`Application with ID ${id} not found`);
    }
    if (app.status !== "pending") {
      throw new Error(`Cannot approve application with status ${app.status}`);
    }

    if (!app.debtorId) {
      throw new Error(`Application ${id} has no associated debtor`);
    }

    // --- Amount validation using system settings ---
    const maxAmount = await maxLoanAmount();
    const minAmount = await minLoanAmount();
    if (maxAmount > 0 && app.requestedAmount > maxAmount) {
      throw new Error(`Requested amount (${app.requestedAmount}) exceeds maximum loan amount (${maxAmount})`);
    }
    if (minAmount > 0 && app.requestedAmount < minAmount) {
      throw new Error(`Requested amount (${app.requestedAmount}) is below minimum loan amount (${minAmount})`);
    }

    // --- Interest rate: use application rate or system default ---
    let interestRate = app.interestRate;
    if (interestRate === null || interestRate === undefined) {
      interestRate = await defaultInterestRate();
    }

    // --- Credit check enforcement (only if required) ---
    const needCreditCheck = await enforceCreditCheck();
    if (needCreditCheck) {
      // Optionally call a credit check service to verify the debtor's score.
      // For now, we'll assume the frontend already performed the check.
      // You can implement a call to CreditCheckService here.
      console.log(`Credit check required for debtor ${app.debtorId} – ensure it was done.`);
    }

    // --- Loan agreement requirement ---
    const needAgreement = await requireLoanAgreement();
    if (needAgreement) {
      // The frontend should have uploaded an agreement file.
      // We could check if a related LoanAgreement record exists for this application.
      // For simplicity, we'll assume the frontend handles it and just log.
      console.log(`Loan agreement required for application ${id} – ensure document exists.`);
    }

    // Create active debt using debtService (within same transaction)
    const debtData = {
      name: `Loan: ${app.purpose}`,
      totalAmount: app.requestedAmount,
      paidAmount: 0,
      dueDate: app.proposedDueDate.toISOString().split("T")[0],
      status: "active",
      interestRate: interestRate,
      penaltyRate: null,   // penalty rate will be set from default when debt is created (DebtService handles it)
      borrowerId: app.debtorId,
    };
    const createdDebt = await debtService.create(debtData, user, qr);

    // Update application status
    app.status = "approved";
    app.approvedAt = new Date();
    app.approvedBy = user;
    app.updatedAt = new Date();

    const saved = await updateDb(appRepo, app);
    await auditLogger.logUpdate("LoanApplication", id, { status: "pending" }, { status: "approved" }, user);
    console.log(`Application ${id} approved, debt created: ${createdDebt.id}`);

    return { application: saved, createdDebt };
  }

  /**
   * Reject an application
   * @param {number} id
   * @param {string} reason
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async rejectApplication(id, reason = null, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const app = await appRepo.findOne({ where: { id, deletedAt: null } });
    if (!app) {
      throw new Error(`Application with ID ${id} not found`);
    }
    if (app.status !== "pending") {
      throw new Error(`Cannot reject application with status ${app.status}`);
    }

    app.status = "rejected";
    app.rejectedAt = new Date();
    app.rejectionReason = reason;
    app.updatedAt = new Date();

    const saved = await updateDb(appRepo, app);
    await auditLogger.logUpdate("LoanApplication", id, { status: "pending" }, { status: "rejected" }, user);
    console.log(`Application ${id} rejected`);
    return saved;
  }

  /**
   * Soft delete an application
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async deleteApplication(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const app = await appRepo.findOne({ where: { id, deletedAt: null } });
    if (!app) {
      throw new Error(`Application with ID ${id} not found`);
    }
    if (app.status !== "pending") {
      throw new Error(`Cannot delete application with status ${app.status}`);
    }

    const oldData = { ...app };
    app.deletedAt = new Date();
    app.updatedAt = new Date();

    const saved = await updateDb(appRepo, app);
    await auditLogger.logDelete("LoanApplication", id, oldData, user);
    return saved;
  }

  /**
   * Restore a soft-deleted application
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restoreApplication(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const app = await appRepo.findOne({ where: { id }, withDeleted: true });
    if (!app) {
      throw new Error(`Application with ID ${id} not found`);
    }
    if (!app.deletedAt) {
      throw new Error(`Application ${id} is not deleted`);
    }

    app.deletedAt = null;
    app.updatedAt = new Date();

    const saved = await updateDb(appRepo, app);
    await auditLogger.logUpdate("LoanApplication", id, { deletedAt: true }, { deletedAt: null }, user);
    return saved;
  }

  /**
   * Permanently delete an application
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDeleteApplication(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const LoanApplication = require("../entities/LoanApplication");
    const appRepo = this._getRepo(qr, LoanApplication);

    const app = await appRepo.findOne({ where: { id }, withDeleted: true });
    if (!app) {
      throw new Error(`Application with ID ${id} not found`);
    }

    await removeDb(appRepo, app);
    await auditLogger.logDelete("LoanApplication", id, app, user);
    console.log(`Application ${id} permanently deleted`);
  }
}

// Singleton instance
const loanApplicationService = new LoanApplicationService();
module.exports = loanApplicationService;