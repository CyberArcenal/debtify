// services/BorrowerService.js

const auditLogger = require("../utils/auditLogger");
const { validateBorrowerData } = require("../utils/borrowerUtils");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
class BorrowerService {
  constructor() {
    this.borrowerRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const Borrower = require("../entities/Borrower");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.borrowerRepository = AppDataSource.getRepository(Borrower);
    console.log("BorrowerService initialized");
  }

  async getRepository() {
    if (!this.borrowerRepository) {
      await this.initialize();
    }
    return this.borrowerRepository;
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
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
   * Create a new borrower
   * @param {Object} borrowerData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(borrowerData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const Borrower = require("../entities/Borrower");
    const repo = this._getRepo(qr);

    try {
      const validation = validateBorrowerData(borrowerData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const { name, contact, email, address, notes } = borrowerData;

      // Check for duplicate email (if provided)
      if (email) {
        const existing = await repo.findOne({ where: { email } });
        if (existing) {
          throw new Error(`Borrower with email "${email}" already exists`);
        }
      }

      // Check duplicate contact (if provided)
      if (contact) {
        const existing = await repo.findOne({ where: { contact } });
        if (existing) {
          throw new Error(`Borrower with contact "${contact}" already exists`);
        }
      }

      const borrower = repo.create({
        name,
        contact: contact || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saved = await saveDb(repo, borrower);
      await auditLogger.logCreate("Borrower", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create borrower:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing borrower
   * @param {number} id
   * @param {Object} borrowerData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async update(id, borrowerData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr);

    try {
      const existing = await repo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Borrower with ID ${id} not found`);
      }
      const oldData = { ...existing };

      // Uniqueness checks for email/contact if changed
      if (borrowerData.email && borrowerData.email !== existing.email) {
        const duplicate = await repo.findOne({
          where: { email: borrowerData.email },
        });
        if (duplicate) {
          throw new Error(`Email "${borrowerData.email}" already in use`);
        }
      }
      if (borrowerData.contact && borrowerData.contact !== existing.contact) {
        const duplicate = await repo.findOne({
          where: { contact: borrowerData.contact },
        });
        if (duplicate) {
          throw new Error(`Contact "${borrowerData.contact}" already in use`);
        }
      }

      Object.assign(existing, borrowerData);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Borrower", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update borrower:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a borrower (set deletedAt)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr);

    try {
      const borrower = await repo.findOne({ where: { id } });
      if (!borrower) {
        throw new Error(`Borrower with ID ${id} not found`);
      }
      if (borrower.deletedAt) {
        throw new Error(`Borrower #${id} is already deleted`);
      }

      const oldData = { ...borrower };
      borrower.deletedAt = new Date();
      borrower.updatedAt = new Date();

      const saved = await updateDb(repo, borrower);
      await auditLogger.logDelete("Borrower", id, oldData, user);
      console.log(`Borrower soft deleted: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to delete borrower:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted borrower
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr);

    try {
      const borrower = await repo.findOne({ where: { id }, withDeleted: true });
      if (!borrower) {
        throw new Error(`Borrower with ID ${id} not found`);
      }
      if (!borrower.deletedAt) {
        throw new Error(`Borrower #${id} is not deleted`);
      }

      borrower.deletedAt = null;
      borrower.updatedAt = new Date();

      const saved = await updateDb(repo, borrower);
      await auditLogger.logUpdate(
        "Borrower",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Borrower restored: #${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to restore borrower:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a borrower (hard delete) – use with caution
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr);

    const borrower = await repo.findOne({ where: { id }, withDeleted: true });
    if (!borrower) {
      throw new Error(`Borrower with ID ${id} not found`);
    }

    await removeDb(repo, borrower);
    await auditLogger.logDelete("Borrower", id, borrower, user);
    console.log(`Borrower #${id} permanently deleted`);
  }

  /**
   * Find borrower by ID (excludes soft-deleted by default)
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const repo = await this.getRepository();
    const options = { where: { id } };
    if (!includeDeleted) {
      options.where.deletedAt = null;
    }
    const borrower = await repo.findOne(options);
    if (!borrower) {
      throw new Error(`Borrower with ID ${id} not found`);
    }
    await auditLogger.logView("Borrower", id, "system");
    return borrower;
  }

  /**
   * Find all borrowers with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const repo = await this.getRepository();
    const qb = repo.createQueryBuilder("borrower");

    // Exclude soft-deleted unless explicitly requested
    if (!options.includeDeleted) {
      qb.andWhere("borrower.deletedAt IS NULL");
    }

    // Filters
    if (options.search) {
      qb.andWhere(
        "(borrower.name LIKE :search OR borrower.email LIKE :search OR borrower.contact LIKE :search OR borrower.address LIKE :search)",
        { search: `%${options.search}%` },
      );
    }
    if (options.name) {
      qb.andWhere("borrower.name LIKE :name", { name: `%${options.name}%` });
    }
    if (options.email) {
      qb.andWhere("borrower.email = :email", { email: options.email });
    }
    if (options.contact) {
      qb.andWhere("borrower.contact = :contact", { contact: options.contact });
    }

    // Sorting
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`borrower.${sortBy}`, sortOrder);

    // 👇 Use the utility
    const result = await paginateQueryBuilder(qb, {
      page: options.page,
      limit: options.limit,
    });

    await auditLogger.logView("Borrower", null, "system");
    return result; // { data: [], pagination: {} }
  }

  /**
   * Get borrower statistics
   */
  async getStatistics() {
    const repo = await this.getRepository();
    const total = await repo.count({ where: { deletedAt: null } });
    const totalWithEmail = await repo.count({
      where: { deletedAt: null, email: { $not: null } },
    });
    const totalWithContact = await repo.count({
      where: { deletedAt: null, contact: { $not: null } },
    });
    const recentlyAdded = await repo.count({
      where: {
        deletedAt: null,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return { total, totalWithEmail, totalWithContact, recentlyAdded };
  }

  /**
   * Export borrowers to CSV or JSON
   * @param {string} format - 'csv' or 'json'
   * @param {Object} filters
   * @param {string} user
   */
  async exportBorrowers(format = "json", filters = {}, user = "system") {
    const result = await this.findAll(filters);
    const borrowers = result.data;

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Name",
        "Contact",
        "Email",
        "Address",
        "Notes",
        "Created At",
        "Updated At",
      ];
      const rows = borrowers.map((b) => [
        b.id,
        b.name,
        b.contact || "",
        b.email || "",
        b.address || "",
        b.notes || "",
        new Date(b.createdAt).toLocaleDateString(),
        new Date(b.updatedAt).toLocaleDateString(),
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `borrowers_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: borrowers,
        filename: `borrowers_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    await auditLogger.logExport("Borrower", format, filters, user);
    console.log(`Exported ${borrowers.length} borrowers in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create borrowers
   * @param {Array<Object>} borrowersArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkCreate(borrowersArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of borrowersArray) {
      try {
        const saved = await this.create(data, user, qr);
        results.created.push(saved);
      } catch (err) {
        results.errors.push({ borrower: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update borrowers
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
   * Import borrowers from CSV file
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
        const borrowerData = {
          name: record.name,
          contact: record.contact || null,
          email: record.email || null,
          address: record.address || null,
          notes: record.notes || null,
        };
        const validation = validateBorrowerData(borrowerData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(borrowerData, user, qr);
        results.imported.push(saved);
      } catch (err) {
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }
}

// Singleton instance
const borrowerService = new BorrowerService();
module.exports = borrowerService;
