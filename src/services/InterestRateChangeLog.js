// src/services/InterestRateChangeLogService.js
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");

class InterestRateChangeLogService {
  constructor() {
    this.logRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.logRepository = AppDataSource.getRepository(InterestRateChangeLog);
    console.log("InterestRateChangeLogService initialized");
  }

  async getRepository() {
    if (!this.logRepository) await this.initialize();
    return this.logRepository;
  }

  _getRepo(qr, entityClass) {
    if (qr) return qr.manager.getRepository(entityClass);
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Create a log entry for an interest rate change.
   * @param {string} settingKey - e.g., "default_interest_rate" or "loan_123"
   * @param {number|string} oldValue
   * @param {number|string} newValue
   * @param {string} user
   * @param {number|null} loanId - optional, for per‑loan changes
   * @param {string|null} reason
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async createLog(settingKey, oldValue, newValue, user = "system", loanId = null, reason = null, queryRunner = null) {
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    const repo = this._getRepo(queryRunner, InterestRateChangeLog);
    const log = repo.create({
      setting_key: settingKey,
      old_value: oldValue,
      new_value: newValue,
      changed_by: user,
      reason,
      loan_id: loanId,
    });
    const saved = await repo.save(log);
    await auditLogger.logCreate("InterestRateChangeLog", saved.id, saved, user);
    return saved;
  }

  /**
   * Get all log entries, optionally filtered.
   * @param {Object} filters
   * @param {string} [filters.settingKey]
   * @param {number} [filters.loanId]
   * @param {string} [filters.changedBy]
   * @param {Date|string} [filters.fromDate]
   * @param {Date|string} [filters.toDate]
   * @param {number} [page=1]
   * @param {number} [limit=50]
   */
  async getAllLogs(filters = {}, page = 1, limit = 50) {
    const repo = await this.getRepository();
    const qb = repo.createQueryBuilder("log").orderBy("log.changed_at", "DESC");

    if (filters.settingKey) qb.andWhere("log.setting_key = :key", { key: filters.settingKey });
    if (filters.loanId) qb.andWhere("log.loan_id = :loanId", { loanId: filters.loanId });
    if (filters.changedBy) qb.andWhere("log.changed_by = :user", { user: filters.changedBy });
    if (filters.fromDate) qb.andWhere("log.changed_at >= :from", { from: new Date(filters.fromDate) });
    if (filters.toDate) qb.andWhere("log.changed_at <= :to", { to: new Date(filters.toDate) });

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single log entry by ID.
   */
  async getLogById(id) {
    const repo = await this.getRepository();
    const log = await repo.findOne({ where: { id } });
    if (!log) throw new Error(`Interest rate log #${id} not found`);
    return log;
  }

  /**
   * Get all logs for a specific loan.
   */
  async getLogsForLoan(loanId, page = 1, limit = 50) {
    return this.getAllLogs({ loanId }, page, limit);
  }

  /**
   * Delete a log entry (soft delete is not implemented; we remove it permanently).
   * Only for correction purposes – audit will track the deletion.
   */
  async deleteLog(id, user = "system", queryRunner = null) {
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    const repo = this._getRepo(queryRunner, InterestRateChangeLog);
    const log = await repo.findOne({ where: { id } });
    if (!log) throw new Error(`Interest rate log #${id} not found`);
    await repo.remove(log);
    await auditLogger.logDelete("InterestRateChangeLog", id, log, user);
  }
}

const interestRateChangeLogService = new InterestRateChangeLogService();
module.exports = interestRateChangeLogService;