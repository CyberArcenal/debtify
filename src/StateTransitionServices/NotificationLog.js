// src/services/NotificationLogStateTransitionService.js
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const emailSender = require("../channels/email.sender");

class NotificationLogStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; recipient_email: unknown; subject: unknown; payload: unknown; status: unknown; error_message: unknown; retry_count: unknown; resend_count: unknown; sent_at: unknown; last_error_at: unknown; created_at: unknown; updated_at: unknown; }>) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.logRepo = dataSource.getRepository(NotificationLog);
  }

  /**
   * @param {import("typeorm").EntitySchema<{ id: unknown; recipient_email: unknown; subject: unknown; payload: unknown; status: unknown; error_message: unknown; retry_count: unknown; resend_count: unknown; sent_at: unknown; last_error_at: unknown; created_at: unknown; updated_at: unknown; }>} entity
   * @param {import("typeorm").QueryRunner} queryRunner
   */
  async _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Attempt to deliver the notification when a new log is created
   * @param {Object} log
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onCreate(log, user = "system", queryRunner = null) {
    logger.info(
      `[Transition] Attempting to send notification log #${log.id} (recipient: ${log.recipient_email})`,
    );

    const repo = this._getRepo(NotificationLog, queryRunner);
    let success = false;
    let errorMsg = null;

    try {
      const result = await emailSender.send(
        log.recipient_email,
        log.subject,
        `<p>${log.payload}</p>`,
        log.payload,
        {},
        true, // async
      );
      success = result.success;
      if (!success) errorMsg = "Email send failed";
    } catch (err) {
      errorMsg = err.message;
      logger.error(`Failed to send email for log #${log.id}:`, err);
    }

    if (success) {
      log.status = "sent";
      log.sent_at = new Date();
      log.error_message = null;
    } else {
      log.status = "failed";
      log.error_message = errorMsg;
      log.last_error_at = new Date();
    }
    log.updated_at = new Date();
    await repo.save(log);

    await auditLogger.logCreate(
      "NotificationLog",
      log.id,
      { status: log.status },
      user,
    );
  }

  /**
   * Retry a failed delivery log (manual retry)
   * @param {Object} log
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onRetry(log, user = "system", queryRunner = null) {
    logger.info(
      `[Transition] Retrying failed notification log #${log.id} by ${user}`,
    );

    const repo = this._getRepo(NotificationLog, queryRunner);
    const MAX_RETRIES = 3;

    log.retry_count = (log.retry_count || 0) + 1;
    log.status = "resend";
    log.last_error_at = null;

    let success = false;
    let errorMsg = null;
    try {
      const result = await emailSender.send(
        log.recipient_email,
        log.subject,
        `<p>${log.payload}</p>`,
        log.payload,
        {},
        true,
      );
      success = result.success;
      if (!success) errorMsg = "Email send failed";
    } catch (err) {
      errorMsg = err.message;
    }

    if (success) {
      log.status = "sent";
      log.sent_at = new Date();
      log.error_message = null;
    } else {
      log.status = "failed";
      log.error_message = errorMsg;
      log.last_error_at = new Date();
    }

    if (log.retry_count >= MAX_RETRIES && !success) {
      log.status = "failed";
    }

    log.updated_at = new Date();
    await repo.save(log);
    await auditLogger.logUpdate(
      "NotificationLog",
      log.id,
      { retry_count: log.retry_count - 1 },
      { retry_count: log.retry_count, status: log.status },
      user,
    );
  }

  /**
   * Acknowledge successful delivery (e.g., from webhook) – not used for email currently
   * @param {Object} log
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onAcknowledge(log, user = "system", queryRunner = null) {
    logger.info(
      `[Transition] Acknowledging successful delivery of log #${log.id} by ${user}`,
    );

    const repo = this._getRepo(NotificationLog, queryRunner);
    if (log.status !== "delivered") {
      log.status = "delivered";
      log.sent_at = new Date();
      log.updated_at = new Date();
      await repo.save(log);
      await auditLogger.logUpdate(
        "NotificationLog",
        log.id,
        { status: "sent" },
        { status: "delivered" },
        user,
      );
    }
  }
}

module.exports = { NotificationLogStateTransitionService };
