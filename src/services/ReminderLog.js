// services/ReminderLog.js
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
const auditLogger = require("../utils/auditLogger");
const emailSender = require("../channels/email.sender");
const { logger } = require("../utils/logger");

const LOG_STATUS = {
  QUEUED: "queued",
  SENT: "sent",
  FAILED: "failed",
  RESEND: "resend",
};

const ALLOWED_SORT_COLUMNS = new Set([
  "id",
  "recipient_email",
  "subject",
  "status",
  "retry_count",
  "resend_count",
  "sent_at",
  "last_error_at",
  "created_at",
  "updated_at",
]);

class ReminderLogService {
  constructor() {
    this.reminderRepository = null;
    this.emailSender = emailSender;
    this.logger = logger;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const ReminderLog = require("../entities/NotificationLog"); // entity name remains NotificationLog
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.reminderRepository = AppDataSource.getRepository(ReminderLog);
    console.log("ReminderLogService initialized");
  }

  async getRepository() {
    if (!this.reminderRepository) await this.initialize();
    return this.reminderRepository;
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {Function} entityClass
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

  //#region 📋 READ OPERATIONS

  /**
   * Get all reminders with filtering, sorting, pagination
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {string} [params.status]
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {string} [params.sortBy='created_at']
   * @param {'ASC'|'DESC'} [params.sortOrder='DESC']
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async getAllReminders(params = {}, qr = null) {
    const { page = 1, limit = 50, status, startDate, endDate, sortBy = "created_at", sortOrder = "DESC" } = params;
    const repo = this._getRepo(qr, require("../entities/NotificationLog"));
    const qb = repo.createQueryBuilder("log");

    if (status) qb.andWhere("log.status = :status", { status });
    if (startDate) qb.andWhere("log.created_at >= :startDate", { startDate });
    if (endDate) qb.andWhere("log.created_at <= :endDate", { endDate });

    const safeSortBy = ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : "created_at";
    qb.orderBy(`log.${safeSortBy}`, sortOrder === "DESC" ? "DESC" : "ASC");

    const result = await paginateQueryBuilder(qb, { page, limit });
    await auditLogger.logView("ReminderLog", null, "system");
    return result; // { data: [], pagination: {} }
  }

  /**
   * Get a single reminder by ID
   * @param {Object} params
   * @param {number} params.id
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async getReminderById({ id }, qr = null) {
    if (!id) throw new Error("ID is required");
    const repo = this._getRepo(qr, require("../entities/NotificationLog"));
    const reminder = await repo.findOne({ where: { id } });
    if (!reminder) throw new Error(`Reminder with ID ${id} not found`);
    await auditLogger.logView("ReminderLog", id, "system");
    return reminder;
  }

  /**
   * Get reminders by recipient email with pagination
   * @param {Object} params
   * @param {string} params.recipient_email
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async getRemindersByRecipient({ recipient_email, page = 1, limit = 50 }, qr = null) {
    if (!recipient_email) throw new Error("Recipient email is required");
    const repo = this._getRepo(qr, require("../entities/NotificationLog"));
    const qb = repo.createQueryBuilder("log")
      .where("log.recipient_email = :email", { email: recipient_email })
      .orderBy("log.created_at", "DESC");
    const result = await paginateQueryBuilder(qb, { page, limit });
    await auditLogger.logView("ReminderLog", null, "system");
    return result;
  }

  /**
   * Search reminders by keyword across recipient_email, subject, payload
   * @param {Object} params
   * @param {string} params.keyword
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async searchReminders({ keyword, page = 1, limit = 50 }, qr = null) {
    if (!keyword) throw new Error("Keyword is required");
    const repo = this._getRepo(qr, require("../entities/NotificationLog"));
    const qb = repo.createQueryBuilder("log")
      .where("log.recipient_email LIKE :kw", { kw: `%${keyword}%` })
      .orWhere("log.subject LIKE :kw", { kw: `%${keyword}%` })
      .orWhere("log.payload LIKE :kw", { kw: `%${keyword}%` })
      .orderBy("log.created_at", "DESC");
    const result = await paginateQueryBuilder(qb, { page, limit });
    await auditLogger.logView("ReminderLog", null, "system");
    return result;
  }

  /**
   * Get statistics about reminders
   * @param {Object} params
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async getReminderStats({ startDate, endDate } = {}, qr = null) {
    const repo = this._getRepo(qr, require("../entities/NotificationLog"));
    const qb = repo.createQueryBuilder("log");

    if (startDate) qb.andWhere("log.created_at >= :startDate", { startDate });
    if (endDate) qb.andWhere("log.created_at <= :endDate", { endDate });

    const statusStats = await qb.clone()
      .select("log.status", "status")
      .addSelect("COUNT(log.id)", "count")
      .groupBy("log.status")
      .getRawMany();

    const total = await qb.clone().getCount();
    const avgRetry = await qb.clone()
      .where("log.status = :status", { status: LOG_STATUS.FAILED })
      .select("AVG(log.retry_count)", "avg")
      .getRawOne();

    const last24h = await qb.clone()
      .where("log.created_at >= :date", { date: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .getCount();

    const byStatus = statusStats.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count, 10);
      return acc;
    }, {});

    return {
      total,
      byStatus,
      avgRetryFailed: parseFloat(avgRetry?.avg) || 0,
      last24h,
    };
  }

  //#endregion

  //#region ✏️ WRITE OPERATIONS

  /**
   * Create a new reminder log entry (usually queued)
   * @param {Object} data
   * @param {string} data.to
   * @param {string} data.subject
   * @param {string} [data.html]
   * @param {string} [data.text]
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async createReminder(data, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const ReminderLog = require("../entities/NotificationLog");
    const repo = this._getRepo(qr, ReminderLog);
    const log = repo.create({
      recipient_email: data.to,
      subject: data.subject,
      payload: data.html || data.text,
      status: LOG_STATUS.QUEUED,
      retry_count: 0,
      resend_count: 0,
    });
    const saved = await saveDb(repo, log, { queryRunner: qr });
    await auditLogger.logCreate("ReminderLog", saved.id, saved, user);
    return saved;
  }

  /**
   * Update reminder status (e.g., sent, failed) and timestamps
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.status
   * @param {string|null} [params.errorMessage]
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async updateReminderStatus({ id, status, errorMessage = null }, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const ReminderLog = require("../entities/NotificationLog");
    const repo = this._getRepo(qr, ReminderLog);
    const reminder = await repo.findOne({ where: { id } });
    if (!reminder) throw new Error(`Reminder with ID ${id} not found`);
    const oldData = { ...reminder };
    reminder.status = status;
    reminder.error_message = errorMessage;
    if (status === LOG_STATUS.SENT) reminder.sent_at = new Date();
    else if (status === LOG_STATUS.FAILED) reminder.last_error_at = new Date();
    reminder.updated_at = new Date();
    const saved = await updateDb(repo, reminder, { queryRunner: qr });
    await auditLogger.logUpdate("ReminderLog", id, oldData, saved, user);
    return saved;
  }

  /**
   * Soft delete a reminder (or hard delete? We'll keep hard delete for simplicity)
   * @param {Object} params
   * @param {number} params.id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async deleteReminder({ id }, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const ReminderLog = require("../entities/NotificationLog");
    const repo = this._getRepo(qr, ReminderLog);
    const reminder = await repo.findOne({ where: { id } });
    if (!reminder) throw new Error(`Reminder with ID ${id} not found`);
    await removeDb(repo, reminder);
    await auditLogger.logDelete("ReminderLog", id, reminder, user);
  }

  //#endregion

  //#region 🔄 RETRY / RESEND OPERATIONS

  async _sendAndUpdate(reminder, isResend = false) {
    const sendResult = await this.emailSender.send(
      reminder.recipient_email,
      reminder.subject || "No Subject",
      reminder.payload || "",
      null,
      {},
      false
    );
    if (sendResult?.success) {
      reminder.status = isResend ? LOG_STATUS.RESEND : LOG_STATUS.SENT;
      reminder.sent_at = new Date();
      reminder.error_message = null;
      reminder.last_error_at = null;
    } else {
      reminder.status = LOG_STATUS.FAILED;
      reminder.last_error_at = new Date();
      reminder.error_message = sendResult?.error || "Unknown error";
    }
    if (isResend) reminder.resend_count = (reminder.resend_count || 0) + 1;
    else reminder.retry_count = (reminder.retry_count || 0) + 1;
    reminder.updated_at = new Date();
    return sendResult;
  }

  /**
   * Retry a failed or queued reminder
   * @param {Object} params
   * @param {number} params.id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async retryReminder({ id }, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const ReminderLog = require("../entities/NotificationLog");
    const repo = this._getRepo(qr, ReminderLog);
    const reminder = await repo.findOne({ where: { id } });
    if (!reminder) throw new Error(`Reminder with ID ${id} not found`);
    if (![LOG_STATUS.FAILED, LOG_STATUS.QUEUED].includes(reminder.status)) {
      throw new Error(`Cannot retry reminder with status: ${reminder.status}`);
    }
    const oldData = { ...reminder };
    const sendResult = await this._sendAndUpdate(reminder, false);
    const saved = await updateDb(repo, reminder, { queryRunner: qr });
    await auditLogger.logUpdate("ReminderLog", id, oldData, saved, user);
    return saved;
  }

  /**
   * Retry all failed/queued reminders (optionally filtered)
   * @param {Object} params
   * @param {Object} [params.filters]
   * @param {string} [params.filters.recipient_email]
   * @param {string} [params.filters.createdBefore]
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async retryAllFailedReminders({ filters = {} } = {}, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const ReminderLog = require("../entities/NotificationLog");
    const repo = this._getRepo(qr, ReminderLog);
    const qb = repo.createQueryBuilder("log")
      .where("log.status IN (:...statuses)", { statuses: [LOG_STATUS.FAILED, LOG_STATUS.QUEUED] });
    if (filters.recipient_email) qb.andWhere("log.recipient_email = :email", { email: filters.recipient_email });
    if (filters.createdBefore) qb.andWhere("log.created_at <= :before", { before: filters.createdBefore });
    const reminders = await qb.getMany();
    const results = [];
    for (const reminder of reminders) {
      const oldData = { ...reminder };
      const sendResult = await this._sendAndUpdate(reminder, false);
      const saved = await updateDb(repo, reminder, { queryRunner: qr });
      await auditLogger.logUpdate("ReminderLog", reminder.id, oldData, saved, user);
      results.push({ id: reminder.id, success: sendResult?.success, error: sendResult?.error });
    }
    return { successCount: results.filter(r => r.success).length, failCount: results.length - results.filter(r => r.success).length, results };
  }

  /**
   * Manually resend a reminder (regardless of current status)
   * @param {Object} params
   * @param {number} params.id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async resendReminder({ id }, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const ReminderLog = require("../entities/NotificationLog");
    const repo = this._getRepo(qr, ReminderLog);
    const reminder = await repo.findOne({ where: { id } });
    if (!reminder) throw new Error(`Reminder with ID ${id} not found`);
    const oldData = { ...reminder };
    const sendResult = await this._sendAndUpdate(reminder, true);
    const saved = await updateDb(repo, reminder, { queryRunner: qr });
    await auditLogger.logUpdate("ReminderLog", id, oldData, saved, user);
    return saved;
  }

  //#endregion
}

const reminderLogService = new ReminderLogService();
module.exports = { ReminderLogService, reminderLogService, LOG_STATUS };