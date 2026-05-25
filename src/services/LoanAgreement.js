// services/LoanAgreementService.js
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
const auditLogger = require("../utils/auditLogger");
const { validateLoanAgreementData } = require("../utils/loanAgreementUtils");
const fs = require("fs").promises;
const path = require("path");

class LoanAgreementService {
  constructor() {
    this.agreementRepository = null;
    this.debtRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const LoanAgreement = require("../entities/LoanAgreement");
    const Debt = require("../entities/Debt");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.agreementRepository = AppDataSource.getRepository(LoanAgreement);
    this.debtRepository = AppDataSource.getRepository(Debt);
    console.log("LoanAgreementService initialized");
  }

  async getRepositories() {
    if (!this.agreementRepository) {
      await this.initialize();
    }
    return {
      agreement: this.agreementRepository,
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
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Global._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Global._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Save uploaded agreement file to disk
   */
  async _saveAgreementFile(fileBuffer, originalName, agreementId) {
    const uploadDir = path.join(__dirname, "../uploads/agreements");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    const ext = path.extname(originalName);
    const filename = `agreement_${agreementId}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, fileBuffer);
    return filePath;
  }

  async _deleteAgreementFile(filePath) {
    if (filePath) {
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(
          `Could not delete agreement file: ${filePath}`,
          err.message,
        );
      }
    }
  }

  /**
   * Create a new loan agreement (status = 'draft')
   */
  async create(agreementData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    const agreementRepo = this._getRepo(qr, LoanAgreement);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const validation = validateLoanAgreementData(agreementData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const existing = await agreementRepo.findOne({
        where: { debt: { id: agreementData.debtId }, deletedAt: null },
      });
      if (existing && existing.status === "signed") {
        throw new Error(
          `Debt #${agreementData.debtId} already has a signed agreement. Cannot create another.`,
        );
      }

      if (existing && existing.status === "draft") {
        // Puwede mong i‑update ang draft o mag-throw ng error depende sa business rule
        throw new Error(
          `Debt #${debtId} already has a draft agreement. Please edit that instead.`,
        );
      }

      const {
        agreementDate,
        lenderName,
        termsText,
        fileBuffer,
        fileName,
        debtId,
      } = agreementData;

      const debt = await debtRepo.findOne({ where: { id: debtId } });
      if (!debt) throw new Error(`Debt with ID ${debtId} not found`);

      // ✅ Draft by default
      const agreement = agreementRepo.create({
        agreementDate: agreementDate ? new Date(agreementDate) : new Date(),
        lenderName: lenderName || null,
        termsText: termsText || null,
        filePath: null,
        status: "draft",
        signedAt: null,
        signedBy: null,
        debt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saved = await saveDb(agreementRepo, agreement, { queryRunner: qr });

      if (fileBuffer && fileName) {
        const savedFilePath = await this._saveAgreementFile(
          fileBuffer,
          fileName,
          saved.id,
        );
        saved.filePath = savedFilePath;
        await saveDb(agreementRepo, saved, { queryRunner: qr });
      }

      await auditLogger.logCreate("LoanAgreement", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create loan agreement:", error.message);
      throw error;
    }
  }

  /**
   * Update a loan agreement – only allowed if status === 'draft'
   */
  async update(id, agreementData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    const agreementRepo = this._getRepo(qr, LoanAgreement);
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    const existing = await agreementRepo.findOne({
      where: { id },
      relations: ["debt"],
    });
    if (!existing) throw new Error(`Loan agreement with ID ${id} not found`);

    // ✅ Prevent updates if already signed
    if (existing.status === "signed") {
      throw new Error(
        "Cannot update a signed loan agreement for legal integrity.",
      );
    }

    const oldData = { ...existing };

    // Update debt relation if changed
    if (agreementData.debtId && agreementData.debtId !== existing.debt?.id) {
      const newDebt = await debtRepo.findOne({
        where: { id: agreementData.debtId },
      });
      if (!newDebt)
        throw new Error(`Debt with ID ${agreementData.debtId} not found`);
      existing.debt = newDebt;
      delete agreementData.debtId;
    }

    // Handle file replacement
    if (agreementData.fileBuffer && agreementData.fileName) {
      if (existing.filePath) await this._deleteAgreementFile(existing.filePath);
      const newFilePath = await this._saveAgreementFile(
        agreementData.fileBuffer,
        agreementData.fileName,
        existing.id,
      );
      existing.filePath = newFilePath;
      delete agreementData.fileBuffer;
      delete agreementData.fileName;
    } else if (agreementData.removeFile === true) {
      if (existing.filePath) {
        await this._deleteAgreementFile(existing.filePath);
        existing.filePath = null;
      }
      delete agreementData.removeFile;
    }

    if (agreementData.agreementDate) {
      agreementData.agreementDate = new Date(agreementData.agreementDate);
    }
    Object.assign(existing, agreementData);
    existing.updatedAt = new Date();

    const saved = await updateDb(agreementRepo, existing, {
      queryRunner: qr,
      skipSignal: true,
    });
    await auditLogger.logUpdate("LoanAgreement", id, oldData, saved, user);
    return saved;
  }

  /**
   * Sign a loan agreement (draft → signed). Irreversible.
   */
  async signAgreement(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    // ✅ Siguraduhing i-load ang debt relation
    const existing = await agreementRepo.findOne({
      where: { id },
      relations: ["debt"],
    });
    if (!existing) throw new Error(`Loan agreement with ID ${id} not found`);
    if (!existing.debt)
      throw new Error(`Debt relation missing for agreement #${id}`);
    if (existing.status === "signed")
      throw new Error("Loan agreement is already signed.");

    // ✅ Check kung may ibang signed agreement para sa same debt
    const otherSigned = await agreementRepo.findOne({
      where: {
        debt: { id: existing.debt.id },
        status: "signed",
        deletedAt: null,
      },
    });
    if (otherSigned && otherSigned.id !== id) {
      throw new Error(
        `Debt #${existing.debt.id} already has a signed agreement. Cannot sign another.`,
      );
    }

    existing.status = "signed";
    existing.signedAt = new Date();
    existing.signedBy = user;
    existing.updatedAt = new Date();

    const saved = await updateDb(agreementRepo, existing, {
      queryRunner: qr,
      skipSignal: false,
    });
    await auditLogger.logUpdate(
      "LoanAgreement",
      id,
      { status: "draft" },
      { status: "signed", signedBy: user, signedAt: existing.signedAt },
      user,
    );
    console.log(`Loan agreement #${id} signed by ${user}`);
    return saved;
  }

  /**
   * Soft delete – optionally restrict for signed agreements (optional, but recommended)
   * @param {boolean} [allowDeleteSigned=false] - If true, allow delete even if signed (default false)
   */
  async delete(id, user = "system", qr = null, allowDeleteSigned = false) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    const agreement = await agreementRepo.findOne({ where: { id } });
    if (!agreement) throw new Error(`Loan agreement with ID ${id} not found`);
    if (agreement.deletedAt)
      throw new Error(`Loan agreement #${id} is already deleted`);

    // ✅ Prevent soft delete of signed agreements unless explicitly allowed
    if (agreement.status === "signed" && !allowDeleteSigned) {
      throw new Error(
        "Cannot delete a signed loan agreement. Set allowDeleteSigned=true to override.",
      );
    }

    const oldData = { ...agreement };
    agreement.deletedAt = new Date();
    agreement.updatedAt = new Date();

    const saved = await updateDb(agreementRepo, agreement, {
      queryRunner: qr,
      skipSignal: true,
    });
    await auditLogger.logDelete("LoanAgreement", id, oldData, user);
    console.log(`Loan agreement soft deleted: #${id}`);
    return saved;
  }

  /**
   * Restore a soft-deleted agreement (no extra restriction)
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    const agreement = await agreementRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!agreement) throw new Error(`Loan agreement with ID ${id} not found`);
    if (!agreement.deletedAt)
      throw new Error(`Loan agreement #${id} is not deleted`);

    agreement.deletedAt = null;
    agreement.updatedAt = new Date();

    const saved = await updateDb(agreementRepo, agreement, {
      queryRunner: qr,
      skipSignal: true,
    });
    await auditLogger.logUpdate(
      "LoanAgreement",
      id,
      { deletedAt: true },
      { deletedAt: null },
      user,
    );
    console.log(`Loan agreement restored: #${id}`);
    return saved;
  }

  /**
   * Permanently delete – same rule as soft delete (signed can't be permanently deleted unless allowed)
   */
  async permanentlyDelete(
    id,
    user = "system",
    qr = null,
    allowDeleteSigned = false,
  ) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    const agreement = await agreementRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!agreement) throw new Error(`Loan agreement with ID ${id} not found`);

    if (agreement.status === "signed" && !allowDeleteSigned) {
      throw new Error(
        "Cannot permanently delete a signed loan agreement. Set allowDeleteSigned=true to override.",
      );
    }

    if (agreement.filePath) {
      await this._deleteAgreementFile(agreement.filePath);
    }

    await removeDb(agreementRepo, agreement);
    await auditLogger.logDelete("LoanAgreement", id, agreement, user);
    console.log(`Loan agreement #${id} permanently deleted`);
  }

  /**
   * Find by ID (no change)
   */
  async findById(id, includeDeleted = false) {
    const { agreement: agreementRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt"] };
    if (!includeDeleted) options.where.deletedAt = null;
    const agreement = await agreementRepo.findOne(options);
    if (!agreement) throw new Error(`Loan agreement with ID ${id} not found`);
    await auditLogger.logView("LoanAgreement", id, "system");
    return agreement;
  }

  /**
   * Find all (no change)
   */
  async findAll(options = {}) {
    const { agreement: agreementRepo } = await this.getRepositories();
    const qb = agreementRepo
      .createQueryBuilder("agreement")
      .leftJoinAndSelect("agreement.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    if (!options.includeDeleted) qb.andWhere("agreement.deletedAt IS NULL");

    if (options.debtId)
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    if (options.borrowerId)
      qb.andWhere("borrower.id = :borrowerId", {
        borrowerId: options.borrowerId,
      });
    if (options.lenderName)
      qb.andWhere("agreement.lenderName LIKE :lenderName", {
        lenderName: `%${options.lenderName}%`,
      });
    if (options.agreementDateFrom)
      qb.andWhere("agreement.agreementDate >= :agreementDateFrom", {
        agreementDateFrom: new Date(options.agreementDateFrom),
      });
    if (options.agreementDateTo)
      qb.andWhere("agreement.agreementDate <= :agreementDateTo", {
        agreementDateTo: new Date(options.agreementDateTo),
      });
    if (options.search) {
      qb.andWhere(
        "(agreement.lenderName LIKE :search OR agreement.termsText LIKE :search OR debtor.name LIKE :search)",
        {
          search: `%${options.search}%`,
        },
      );
    }

    const sortBy = options.sortBy || "agreementDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`agreement.${sortBy}`, sortOrder);

    const result = await paginateQueryBuilder(qb, {
      page: options.page,
      limit: options.limit,
    });
    await auditLogger.logView("LoanAgreement", null, "system");
    return result;
  }

  // Statistics, export, bulk operations (unchanged but kept for completeness)
  async getStatistics() {
    const { agreement: agreementRepo } = await this.getRepositories();
    const qb = agreementRepo
      .createQueryBuilder("agreement")
      .where("agreement.deletedAt IS NULL");
    const totalAgreements = await qb.getCount();
    const withFiles = await qb
      .clone()
      .andWhere("agreement.filePath IS NOT NULL")
      .getCount();
    const uniqueLenders = await qb
      .clone()
      .select("COUNT(DISTINCT agreement.lenderName)", "count")
      .getRawOne();
    const agreementsPerDebt = await qb
      .clone()
      .select("COUNT(agreement.id)", "total")
      .addSelect("agreement.debtId")
      .groupBy("agreement.debtId")
      .getRawMany();
    const avgPerDebt = agreementsPerDebt.length
      ? agreementsPerDebt.reduce((sum, row) => sum + parseInt(row.total), 0) /
        agreementsPerDebt.length
      : 0;
    return {
      totalAgreements,
      withFiles,
      uniqueLenders: parseInt(uniqueLenders?.count) || 0,
      averageAgreementsPerDebt: avgPerDebt,
    };
  }

  async exportAgreements(format = "json", filters = {}, user = "system") {
    const result = await this.findAll(filters);
    const agreements = result.data;
    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Agreement Date",
        "Lender Name",
        "Terms Text",
        "File Path",
        "Debt ID",
        "Debt Name",
        "Borrower Name",
        "Created At",
        "Updated At",
      ];
      const rows = agreements.map((a) => [
        a.id,
        a.agreementDate ? new Date(a.agreementDate).toLocaleDateString() : "",
        a.lenderName || "",
        (a.termsText || "").replace(/,/g, " "),
        a.filePath || "",
        a.debt?.id ?? "",
        a.debt?.name ?? "",
        a.debt?.borrower?.name ?? "",
        new Date(a.createdAt).toLocaleDateString(),
        new Date(a.updatedAt).toLocaleDateString(),
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `loan_agreements_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: agreements,
        filename: `loan_agreements_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }
    await auditLogger.logExport("LoanAgreement", format, filters, user);
    console.log(
      `Exported ${agreements.length} loan agreements in ${format} format`,
    );
    return exportData;
  }

  async bulkCreate(agreementsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of agreementsArray) {
      try {
        results.created.push(await this.create(data, user, qr));
      } catch (err) {
        results.errors.push({ agreement: data, error: err.message });
      }
    }
    return results;
  }

  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        results.updated.push(await this.update(id, updates, user, qr));
      } catch (err) {
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

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
        const agreementData = {
          agreementDate: record.agreementDate
            ? new Date(record.agreementDate)
            : new Date(),
          lenderName: record.lenderName || null,
          termsText: record.termsText || null,
          debtId: parseInt(record.debtId, 10),
        };
        const validation = validateLoanAgreementData(agreementData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        results.imported.push(await this.create(agreementData, user, qr));
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

const loanAgreementService = new LoanAgreementService();
module.exports = loanAgreementService;
