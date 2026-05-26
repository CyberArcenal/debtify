// src/main/services/LoanApplication.js
//@ts-check
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
const auditLogger = require("../utils/auditLogger");
// @ts-ignore
const LoanApplication = require("./Debt");
const {
  maxLoanAmount,
  minLoanAmount,
  defaultInterestRate,
  enforceCreditCheck,
  requireLoanAgreement,
  creditCheckValidityDays,
  minCreditScoreForApproval,
} = require("../utils/system");
const creditCheckService = require("./CreditCheck");

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
  // @ts-ignore
  _getRepo(qr, entityClass) {
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[LoanApplication._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(
      `[LoanApplication._getRepo] Using global repository (fallback)`,
    );
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Validate application data
   */
  // @ts-ignore
  _validateApplicationData(data) {
    const errors = [];
    if (!data.requestedAmount || data.requestedAmount <= 0) {
      errors.push("Requested amount must be greater than zero");
    }
    if (
      !data.purpose ||
      typeof data.purpose !== "string" ||
      data.purpose.trim() === ""
    ) {
      errors.push("Purpose is required");
    }
    if (!data.proposedDueDate) {
      errors.push("Proposed due date is required");
    }
    // If new debtor is provided, name is required
    if (
      data.newDebtor &&
      (!data.newDebtor.name || data.newDebtor.name.trim() === "")
    ) {
      errors.push("New debtor name is required");
    }
    // If existing debtor, debtorId must be provided and valid
    if (!data.newDebtor && !data.debtorId) {
      errors.push(
        "Either existing debtorId or newDebtor data must be provided",
      );
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
    // @ts-ignore
    const qb = repo
      .createQueryBuilder("app")
      .leftJoinAndSelect("app.debtor", "debtor")
      .where("app.deletedAt IS NULL");

    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      qb.andWhere("app.status = :status", { status: filters.status });
    }
    // @ts-ignore
    if (filters.debtorId) {
      // @ts-ignore
      qb.andWhere("app.debtorId = :debtorId", { debtorId: filters.debtorId });
    }
    // @ts-ignore
    if (filters.fromDate) {
      qb.andWhere("app.createdAt >= :fromDate", {
        // @ts-ignore
        fromDate: new Date(filters.fromDate),
      });
    }
    // @ts-ignore
    if (filters.toDate) {
      qb.andWhere("app.createdAt <= :toDate", {
        // @ts-ignore
        toDate: new Date(filters.toDate),
      });
    }
    // @ts-ignore
    if (filters.search) {
      qb.andWhere("(app.debtorName LIKE :search OR app.purpose LIKE :search)", {
        // @ts-ignore
        search: `%${filters.search}%`,
      });
    }

    // @ts-ignore
    const sortBy = filters.sortBy || "createdAt";
    // @ts-ignore
    const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`app.${sortBy}`, sortOrder);

    // @ts-ignore
    if (filters.page && filters.limit) {
      // @ts-ignore
      const offset = (filters.page - 1) * filters.limit;
      // @ts-ignore
      qb.skip(offset).take(filters.limit);
    }

    const result = await paginateQueryBuilder(qb, {
      // @ts-ignore
      page: filters.page,
      // @ts-ignore
      limit: filters.limit,
    });

    await auditLogger.logView("LoanApplication", null, "system");
    return result; // { data: [], pagination: {} }
  }

  /**
   * Get application by ID
   * @param {number} id
   */
  async getApplicationById(id) {
    const { application: repo } = await this.getRepositories();
    // @ts-ignore
    const app = await repo.findOne({
      // @ts-ignore
      where: { id, deletedAt: null },
      relations: ["debtor"],
    });
    if (!app) {
      throw new Error(`Loan application with ID ${id} not found`);
    }
    return app;
  }

  // ----------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (CRUD only – no side effects)
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

    // @ts-ignore
    let debtorId = data.debtorId;
    let debtorName = "";
    let debtorContact = null;
    let debtorEmail = null;
    let debtorAddress = null;

    // If new debtor data is provided, create a borrower first
    // @ts-ignore
    if (data.newDebtor) {
      // @ts-ignore
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
      const savedBorrower = await saveDb(borrowerRepo, borrower, {
        // @ts-ignore
        queryRunner: qr,
      });
      debtorId = savedBorrower.id;
      debtorName = savedBorrower.name;
      debtorContact = savedBorrower.contact;
      debtorEmail = savedBorrower.email;
      debtorAddress = savedBorrower.address;
    // @ts-ignore
    } else if (data.debtorId) {
      const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));
      const debtor = await borrowerRepo.findOne({
        // @ts-ignore
        where: { id: data.debtorId },
      });
      if (!debtor) {
        // @ts-ignore
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
      // @ts-ignore
      requestedAmount: data.requestedAmount,
      // @ts-ignore
      purpose: data.purpose,
      // @ts-ignore
      proposedDueDate: new Date(data.proposedDueDate),
      // @ts-ignore
      interestRate: data.interestRate || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // @ts-ignore
    const saved = await saveDb(appRepo, application, { queryRunner: qr });
    await auditLogger.logCreate("LoanApplication", saved.id, saved, user);
    console.log(
      `Loan application created: ID ${saved.id} for debtor ${debtorName}`,
    );
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
    // @ts-ignore
    if (data.requestedAmount !== undefined)
      // @ts-ignore
      app.requestedAmount = data.requestedAmount;
    // @ts-ignore
    if (data.purpose !== undefined) app.purpose = data.purpose;
    // @ts-ignore
    if (data.proposedDueDate !== undefined)
      // @ts-ignore
      app.proposedDueDate = new Date(data.proposedDueDate);
    // @ts-ignore
    if (data.interestRate !== undefined) app.interestRate = data.interestRate;
    app.updatedAt = new Date();

    // @ts-ignore
    const saved = await updateDb(appRepo, app, { queryRunner: qr });
    await auditLogger.logUpdate("LoanApplication", id, oldData, saved, user);
    return saved;
  }

  /**
   * Approve an application – updates status only (no debt creation here)
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
      throw new Error(
        `Requested amount (${app.requestedAmount}) exceeds maximum loan amount (${maxAmount})`,
      );
    }
    if (minAmount > 0 && app.requestedAmount < minAmount) {
      throw new Error(
        `Requested amount (${app.requestedAmount}) is below minimum loan amount (${minAmount})`,
      );
    }

    // --- Interest rate: use application rate or system default ---
    let interestRate = app.interestRate;
    if (interestRate === null || interestRate === undefined) {
      interestRate = await defaultInterestRate();
    }
    // Store the final interest rate on the application (so the state transition can use it)
    app.interestRate = interestRate;

    // --- Credit check enforcement (actual validation) ---
    const needCreditCheck = await enforceCreditCheck();
    if (needCreditCheck) {
      // Get the latest credit check for this debtor
      const latestCheck = await creditCheckService.getLatestCreditCheck(
        app.debtorId,
        qr,
      );

      if (!latestCheck) {
        throw new Error(
          `Credit check required before approval. No credit check found for debtor ID ${app.debtorId}.`,
        );
      }

      const validityDays = await creditCheckValidityDays();
      // @ts-ignore
      const checkDate = new Date(latestCheck.dateChecked);
      const now = new Date();
      const daysSinceCheck = Math.floor(
        // @ts-ignore
        (now - checkDate) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceCheck > validityDays) {
        throw new Error(
          `Credit check is too old (${daysSinceCheck} days). Please perform a new credit check (validity: ${validityDays} days).`,
        );
      }

      const minScore = await minCreditScoreForApproval();
      // @ts-ignore
      if (minScore > 0 && latestCheck.score < minScore) {
        throw new Error(
          // @ts-ignore
          `Credit score (${latestCheck.score}) is below the minimum required (${minScore}). Approval denied.`,
        );
      }
    }

    // --- Loan agreement requirement – just log, not enforce here ---
    const needAgreement = await requireLoanAgreement();
    if (needAgreement) {
      console.log(
        `Loan agreement required for application ${id} – ensure document exists.`,
      );
    }

    // Update application status only – debt creation will be done by state transition service
    app.status = "approved";
    app.approvedAt = new Date();
    app.approvedBy = user;
    app.updatedAt = new Date();

    // @ts-ignore
    const saved = await updateDb(appRepo, app, { queryRunner: qr });
    await auditLogger.logUpdate(
      "LoanApplication",
      id,
      { status: "pending" },
      { status: "approved" },
      user,
    );
    console.log(`Application ${id} approved by ${user}`);

    return { application: saved };
  }

  /**
   * Reject an application
   * @param {number} id
   * @param {string} reason
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  // @ts-ignore
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

    // @ts-ignore
    const saved = await updateDb(appRepo, app, { queryRunner: qr });
    await auditLogger.logUpdate(
      "LoanApplication",
      id,
      { status: "pending" },
      { status: "rejected" },
      user,
    );
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

    // @ts-ignore
    const saved = await updateDb(appRepo, app, { queryRunner: qr });
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

    // @ts-ignore
    const saved = await updateDb(appRepo, app, { queryRunner: qr });
    await auditLogger.logUpdate(
      "LoanApplication",
      id,
      { deletedAt: true },
      { deletedAt: null },
      user,
    );
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
