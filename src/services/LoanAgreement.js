// services/LoanAgreementService.js
//@ts-check
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
const auditLogger = require("../utils/auditLogger");
const { validateLoanAgreementData } = require("../utils/loanAgreementUtils");
const {
  saveAgreementFile,
  deleteAgreementFile,
} = require("../utils/agreementFileStorage");

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
   * Create a new loan agreement (status = 'draft')
   * @param {{ agreementDate: any; lenderName: any; termsText: any; debtId: any; fileBuffer?: any; fileName?: any; filePath?: any; principalAmount?: any; interestRate?: any; penaltyRate?: any; dueDate?: any; purpose?: any; loanStartDate?: any; anniversaryDay?: any; }} agreementData
   */
  async create(agreementData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    // @ts-ignore
    const agreementRepo = this._getRepo(qr, LoanAgreement);
    // @ts-ignore
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    const validation = validateLoanAgreementData(agreementData);
    if (!validation.valid) throw new Error(validation.errors.join(", "));

    const {
      agreementDate,
      lenderName,
      termsText,
      fileBuffer,
      fileName,
      filePath,
      debtId,
      principalAmount,
      interestRate,
      penaltyRate,
      dueDate,
      purpose,
      loanStartDate,
      anniversaryDay,
    } = agreementData;

    const debt = await debtRepo.findOne({ where: { id: debtId } });
    if (!debt) throw new Error(`Debt with ID ${debtId} not found`);

    const agreement = agreementRepo.create({
      agreementDate: agreementDate ? new Date(agreementDate) : new Date(),
      lenderName: lenderName || null,
      termsText: termsText || null,
      filePath: filePath || null,
      debt,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      // snapshot fields
      principalAmount: principalAmount ?? debt.totalAmount,
      interestRate: interestRate ?? debt.interestRate,
      penaltyRate: penaltyRate ?? debt.penaltyRate,
      dueDate: dueDate ? new Date(dueDate) : debt.dueDate,
      purpose: purpose || null,
      loanStartDate: loanStartDate ? new Date(loanStartDate) : debt.createdAt,
      anniversaryDay: anniversaryDay ?? new Date(debt.createdAt).getDate(),
    });

    // @ts-ignore
    const saved = await saveDb(agreementRepo, agreement, { queryRunner: qr });

    // Save uploaded file (if any) using secure storage
    if (fileBuffer && fileName && !filePath) {
      const savedRelativePath = await saveAgreementFile(fileBuffer, fileName);
      saved.filePath = savedRelativePath; // store relative path
      // @ts-ignore
      await saveDb(agreementRepo, saved, { queryRunner: qr });
    }

    await auditLogger.logCreate("LoanAgreement", saved.id, saved, user);
    return saved;
  }

  /**
   * Update a loan agreement – only allowed if status === 'draft'
   * @param {any} id
   * @param {{ debtId: any; fileBuffer: Buffer<ArrayBufferLike>; fileName: string; removeFile: boolean; agreementDate: string | number | Date; }} agreementData
   */
  async update(id, agreementData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    // @ts-ignore
    const agreementRepo = this._getRepo(qr, LoanAgreement);
    // @ts-ignore
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    const existing = await agreementRepo.findOne({
      where: { id },
      relations: ["debt"],
    });
    if (!existing) throw new Error(`Loan agreement with ID ${id} not found`);
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

    // Handle file replacement: save new file first, then delete old
    if (agreementData.fileBuffer && agreementData.fileName) {
      const newRelativePath = await saveAgreementFile(
        agreementData.fileBuffer,
        agreementData.fileName,
      );
      // Delete old file only after new file saved successfully
      if (existing.filePath) await deleteAgreementFile(existing.filePath);
      existing.filePath = newRelativePath;
      // @ts-ignore
      delete agreementData.fileBuffer;
      // @ts-ignore
      delete agreementData.fileName;
    } else if (agreementData.removeFile === true) {
      if (existing.filePath) {
        await deleteAgreementFile(existing.filePath);
        existing.filePath = null;
      }
      // @ts-ignore
      delete agreementData.removeFile;
    }

    // Apply other updates
    if (agreementData.agreementDate) {
      agreementData.agreementDate = new Date(agreementData.agreementDate);
    }
    Object.assign(existing, agreementData);
    existing.updatedAt = new Date();

    // @ts-ignore
    const saved = await updateDb(agreementRepo, existing, {
      queryRunner: qr,
      skipSignal: true,
    });
    await auditLogger.logUpdate("LoanAgreement", id, oldData, saved, user);
    return saved;
  }

  /**
   * Sign a loan agreement (draft → signed). Irreversible.
   * @param {any} id
   */
  async signAgreement(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    // @ts-ignore
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    const existing = await agreementRepo.findOne({
      where: { id },
      relations: ["debt"],
    });
    if (!existing) throw new Error(`Loan agreement with ID ${id} not found`);
    if (!existing.debt)
      throw new Error(`Debt relation missing for agreement #${id}`);
    if (existing.status === "signed")
      throw new Error("Loan agreement is already signed.");

    // Check if another signed agreement exists for the same debt
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

    // @ts-ignore
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
   * Soft delete a loan agreement (set deletedAt)
   * @param {boolean} [allowDeleteSigned] - If true, allow deletion of signed agreements
   * @param {any} id
   */
  async delete(id, user = "system", qr = null, allowDeleteSigned = false) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    // @ts-ignore
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    const agreement = await agreementRepo.findOne({ where: { id } });
    if (!agreement) throw new Error(`Loan agreement with ID ${id} not found`);
    if (agreement.deletedAt)
      throw new Error(`Loan agreement #${id} is already deleted`);

    if (agreement.status === "signed" && !allowDeleteSigned) {
      throw new Error(
        "Cannot delete a signed loan agreement. Set allowDeleteSigned=true to override.",
      );
    }

    // Delete associated file before soft-deleting record
    if (agreement.filePath) {
      await deleteAgreementFile(agreement.filePath);
    }

    const oldData = { ...agreement };
    agreement.deletedAt = new Date();
    agreement.updatedAt = new Date();

    // @ts-ignore
    const saved = await updateDb(agreementRepo, agreement, {
      queryRunner: qr,
      skipSignal: true,
    });
    await auditLogger.logDelete("LoanAgreement", id, oldData, user);
    console.log(`Loan agreement soft deleted: #${id}`);
    return saved;
  }

  /**
   * Restore a soft-deleted loan agreement
   * @param {any} id
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    // @ts-ignore
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

    // @ts-ignore
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
   * Permanently delete a loan agreement (hard delete)
   * @param {boolean} [allowDeleteSigned] - If true, allow permanent deletion of signed agreements
   * @param {any} id
   */
  async permanentlyDelete(
    id,
    user = "system",
    qr = null,
    allowDeleteSigned = false,
  ) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const LoanAgreement = require("../entities/LoanAgreement");
    // @ts-ignore
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

    // Delete associated file
    if (agreement.filePath) {
      await deleteAgreementFile(agreement.filePath);
    }

    // @ts-ignore
    await removeDb(agreementRepo, agreement);
    await auditLogger.logDelete("LoanAgreement", id, agreement, user);
    console.log(`Loan agreement #${id} permanently deleted`);
  }

  /**
   * Find by ID (excludes soft-deleted by default)
   * @param {null | undefined} id
   */
  async findById(id, includeDeleted = false) {
    const { agreement: agreementRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt"] };
    // @ts-ignore
    if (!includeDeleted) options.where.deletedAt = null;
    // @ts-ignore
    const agreement = await agreementRepo.findOne(options);
    if (!agreement) throw new Error(`Loan agreement with ID ${id} not found`);
    await auditLogger.logView("LoanAgreement", id, "system");
    return agreement;
  }

  /**
   * Find all loan agreements with filters, pagination, sorting
   */
  async findAll(options = {}) {
    const { agreement: agreementRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = agreementRepo
      .createQueryBuilder("agreement")
      .leftJoinAndSelect("agreement.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // @ts-ignore
    if (!options.includeDeleted) qb.andWhere("agreement.deletedAt IS NULL");

    // @ts-ignore
    if (options.debtId)
      // @ts-ignore
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    // @ts-ignore
    if (options.borrowerId)
      qb.andWhere("borrower.id = :borrowerId", {
        // @ts-ignore
        borrowerId: options.borrowerId,
      });
    // @ts-ignore
    if (options.lenderName)
      qb.andWhere("agreement.lenderName LIKE :lenderName", {
        // @ts-ignore
        lenderName: `%${options.lenderName}%`,
      });
    // @ts-ignore
    if (options.agreementDateFrom)
      qb.andWhere("agreement.agreementDate >= :agreementDateFrom", {
        // @ts-ignore
        agreementDateFrom: new Date(options.agreementDateFrom),
      });
    // @ts-ignore
    if (options.agreementDateTo)
      qb.andWhere("agreement.agreementDate <= :agreementDateTo", {
        // @ts-ignore
        agreementDateTo: new Date(options.agreementDateTo),
      });
    // @ts-ignore
    if (options.search) {
      qb.andWhere(
        "(agreement.lenderName LIKE :search OR agreement.termsText LIKE :search OR debtor.name LIKE :search)",
        // @ts-ignore
        { search: `%${options.search}%` },
      );
    }

    // @ts-ignore
    const sortBy = options.sortBy || "agreementDate";
    // @ts-ignore
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`agreement.${sortBy}`, sortOrder);

    const result = await paginateQueryBuilder(qb, {
      // @ts-ignore
      page: options.page,
      // @ts-ignore
      limit: options.limit,
    });
    await auditLogger.logView("LoanAgreement", null, "system");
    return result;
  }

  // ----------------------------------------------------------------------
  // Statistics, export, bulk operations (unchanged)
  // ----------------------------------------------------------------------

  async getStatistics() {
    const { agreement: agreementRepo } = await this.getRepositories();
    // @ts-ignore
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
    // @ts-ignore
    await auditLogger.logExport("LoanAgreement", format, filters, user);
    console.log(
      `Exported ${agreements.length} loan agreements in ${format} format`,
    );
    return exportData;
  }

  /**
   * @param {any} agreementsArray
   */
  async bulkCreate(agreementsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of agreementsArray) {
      try {
        // @ts-ignore
        results.created.push(await this.create(data, user, qr));
      } catch (err) {
        // @ts-ignore
        results.errors.push({ agreement: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * @param {any} updatesArray
   */
  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        // @ts-ignore
        results.updated.push(await this.update(id, updates, user, qr));
      } catch (err) {
        // @ts-ignore
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

  /**
   * @param {import("node:fs").PathLike | fs.FileHandle} filePath
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
        const agreementData = {
          // @ts-ignore
          agreementDate: record.agreementDate
            // @ts-ignore
            ? new Date(record.agreementDate)
            : new Date(),
          // @ts-ignore
          lenderName: record.lenderName || null,
          // @ts-ignore
          termsText: record.termsText || null,
          // @ts-ignore
          debtId: parseInt(record.debtId, 10),
        };
        const validation = validateLoanAgreementData(agreementData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        // @ts-ignore
        results.imported.push(await this.create(agreementData, user, qr));
      } catch (err) {
        // @ts-ignore
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

const loanAgreementService = new LoanAgreementService();
module.exports = loanAgreementService;
