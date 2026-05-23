// src/channels/email.sender.js
const nodemailer = require("nodemailer");
const PQueue = require("p-queue").default;
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");
const { BrowserWindow } = require("electron");

class EmailSender {
  constructor() {
    this.queue = new PQueue({ concurrency: 1 });
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * @param {string} channel
   * @param {{ to: any; subject: any; status: string; attempt: number; timestamp: string; messageId?: string; error?: any; }} data
   */
  _sendToRenderers(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }

  /**
   * @param {string} to
   * @param {string} subject
   * @param {string} html
   * @param {string} text
   * @param {object} options
   * @param {boolean} asyncMode
   */
  async send(to, subject, html, text, options = {}, asyncMode = true) {
    if (asyncMode) {
      this.queue.add(() =>
        this._sendWithRetry(to, subject, html, text, options),
      );
      logger.info(`📥 Queued email → To: ${to}, Subject: "${subject}"`);
      return { success: true, queued: true };
    } else {
      return await this._sendWithRetry(to, subject, html, text, options);
    }
  }

  /**
   * @private
   */
  async _sendWithRetry(to, subject, html, text, options) {
    let attempt = 0;
    let lastError;
    let currentLogId = null;

    this._sendToRenderers("email:status", {
      to,
      subject,
      status: "sending",
      attempt: 1,
      timestamp: new Date().toISOString(),
    });

    while (attempt < this.maxRetries) {
      attempt++;
      try {
        logger.info(
          `📨 Attempt ${attempt} sending email → To: ${to}, Subject: "${subject}"`,
        );

        // 1. Create/update log entry (first attempt = queued, retries = resend)
        const log = await this._updateLog(
          to,
          subject,
          html,
          attempt === 1 ? "queued" : "resend",
          attempt,
          null,
          currentLogId,
        );
        currentLogId = log?.id || null;

        // 2. Actually send the email
        const result = await this._sendInternal(
          to,
          subject,
          html,
          text,
          options,
        );

        // 3. Mark as sent
        await this._updateLog(
          to,
          subject,
          html,
          "sent",
          attempt,
          null,
          currentLogId,
        );

        logger.info(`✅ Email sent → To: ${to}, Attempt: ${attempt}`);
        this._sendToRenderers("email:status", {
          to,
          subject,
          status: "sent",
          attempt,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        });
        return result;
      } catch (error) {
        lastError = error;
        logger.error(`❌ Attempt ${attempt} failed → To: ${to}`, error);

        this._sendToRenderers("email:status", {
          to,
          subject,
          status: "failed",
          attempt,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        // Update log with failure
        await this._updateLog(
          to,
          subject,
          html,
          "failed",
          attempt,
          error.message,
          currentLogId,
        );

        if (attempt < this.maxRetries) {
          logger.warn(`⏳ Retrying in ${this.retryDelay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // All retries exhausted – the failure is already logged. No need to create an extra notification.
    throw lastError;
  }

  /**
   * @private
   */
  async _sendInternal(to, subject, html, text, options = {}) {
    const {
      emailEnabled,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      companyName,
      smtpFromEmail,
    } = require("../utils/system");

    if (!(await emailEnabled())) {
      throw new Error("Email notifications are disabled");
    }

    const host = await smtpHost();
    const port = await smtpPort();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: await smtpUsername(),
        pass: await smtpPassword(),
      },
    });

    const mailOptions = {
      from: `${await companyName()} <${await smtpFromEmail()}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  }

  /**
   * Upsert a notification log entry.
   * Waits for the database to be ready (retries up to 10 times).
   * @private
   */
  async _updateLog(
    to,
    subject,
    html,
    status,
    retryCount,
    errorMessage = null,
    existingLogId = null,
  ) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    await this._waitForDbReady();

    const repo = AppDataSource.getRepository(NotificationLog);

    try {
      let log = null;

      if (existingLogId) {
        log = await repo.findOneBy({ id: existingLogId });
      }

      if (!log) {
        log = repo.create({
          recipient_email: to,
          subject,
          payload: html,
          status,
          retry_count: retryCount,
          error_message: errorMessage,
          sent_at: status === "sent" ? new Date() : null,
          last_error_at: status === "failed" ? new Date() : null,
        });
      } else {
        log.status = status;
        log.retry_count = retryCount;
        if (status === "sent") {
          log.sent_at = new Date();
          log.error_message = null;
        } else if (status === "failed") {
          log.last_error_at = new Date();
          log.error_message = errorMessage;
        } else if (status === "resend") {
          log.resend_count = (log.resend_count || 0) + 1;
        }
      }

      const saved = await saveDb(repo, log, { skipSignal: true });
      logger.debug(
        `📌 NotificationLog ${saved.id} → Status: ${status}, Retry: ${retryCount}`,
      );
      return saved;
    } catch (err) {
      logger.error(
        "❌ Failed to update NotificationLog (will retry later)",
        err,
      );
      return null;
    }
  }

  /**
   * Wait for TypeORM DataSource to be initialised.
   * Retries up to 20 times with exponential backoff.
   * @private
   */
  async _waitForDbReady() {
    const maxAttempts = 20;
    let delay = 50;

    for (let i = 0; i < maxAttempts; i++) {
      if (AppDataSource.isInitialized) {
        return true;
      }
      logger.debug(
        `⏳ Waiting for database connection... (${i + 1}/${maxAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 2000);
    }

    logger.error(
      "❌ Database not ready after maximum attempts – logging skipped",
    );
    return false;
  }
}

module.exports = new EmailSender();
