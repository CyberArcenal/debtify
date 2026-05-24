// src/services/NotificationLogStateTransitionService.js
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const emailSender = require("../channels/email.sender");

class NotificationLogStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.logRepo = dataSource.getRepository(NotificationLog);
  }

  /**
   * Get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner|null} qr
   * @returns {import("typeorm").Repository}
   */
  _getRepo(qr) {
    if (qr) {
      return qr.manager.getRepository(NotificationLog);
    }
    return this.logRepo;
  }

  /**
   * Attempt to deliver the notification when a new log is created
   * @param {Object} log
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onCreate(log, user = "system", queryRunner = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Attempting to send notification log #${log.id} (recipient: ${log.recipient_email})`,
    );

    const repo = this._getRepo(queryRunner);

    // I-wrap ang sending at update sa isang function
    const sendAndUpdate = async () => {
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
          log.id,
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

      const saved = await saveDb(repo, log, { queryRunner, skipSignal: true });
      await auditLogger.logCreate(
        "NotificationLog",
        saved.id,
        { status: saved.status },
        user,
      );

      // Kung nabigo ang email, i-throw para mag-rollback ang transaction (kung synchronous)
      if (!success) throw new Error(`Email sending failed: ${errorMsg}`);
    };

    // Subukan gamitin ang afterCommit kung available
    if (queryRunner && typeof queryRunner.afterCommit === "function") {
      queryRunner.afterCommit(sendAndUpdate);
    } else {
      // Fallback: gawing synchronous – magca-cause ito ng rollback kung mag-fail ang email
      logger.warn(
        `afterCommit not available. Sending email synchronously. QueryRunner type: ${queryRunner?.constructor?.name}`,
      );
      await sendAndUpdate();
    }
  }

  /**
   * Retry a failed delivery log (manual retry)
   * @param {Object} log
   * @param {string} user
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async onRetry(log, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Retrying failed notification log #${log.id} by ${user}`,
    );

    const repo = this._getRepo(queryRunner);
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

    // Use updateDb instead of repo.save
    const oldData = { retry_count: log.retry_count - 1 };
    const saved = await updateDb(repo, log, {
      queryRunner: queryRunner,
      skipSignal: true,
    });
    await auditLogger.logUpdate(
      "NotificationLog",
      log.id,
      oldData,
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
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Acknowledging successful delivery of log #${log.id} by ${user}`,
    );

    const repo = this._getRepo(queryRunner);
    if (log.status !== "delivered") {
      const oldStatus = log.status;
      log.status = "delivered";
      log.sent_at = new Date();
      log.updated_at = new Date();

      // Use updateDb instead of repo.save
      const saved = await updateDb(repo, log, {
        queryRunner: queryRunner,
        skipSignal: true,
      });
      await auditLogger.logUpdate(
        "NotificationLog",
        log.id,
        { status: oldStatus },
        { status: "delivered" },
        user,
      );
    }
  }
}

module.exports = { NotificationLogStateTransitionService };
