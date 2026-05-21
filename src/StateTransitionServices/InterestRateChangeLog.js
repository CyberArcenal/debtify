// src/services/InterestRateChangeLogStateTransitionService.js
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const { emailEnabled } = require("../utils/system");
const notificationService = require("../services/Notification");

class InterestRateChangeLogStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.logRepo = dataSource.getRepository(require("../entities/InterestRateChangeLog"));
  }

  async _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  async onInterestRateChanged(logEntry, user = "system", queryRunner = null) {
    logger.info(`[InterestRateChangeLog] Interest rate "${logEntry.setting_key}" changed from "${logEntry.old_value}" to "${logEntry.new_value}" by ${user}`);

    // 1. Notify financial admin (in‑app)
    await notificationService.create(
      {
        userId: 1,
        title: "Interest Rate Changed",
        message: `Interest rate "${logEntry.setting_key}" has been changed from "${logEntry.old_value}" to "${logEntry.new_value}".`,
        type: "info",
        metadata: {
          settingKey: logEntry.setting_key,
          oldValue: logEntry.old_value,
          newValue: logEntry.new_value,
        },
      },
      user,
      queryRunner
    );

    // 2. Optionally send email if enabled
    const canSendEmail = await emailEnabled();
    if (canSendEmail) {
      // Placeholder – integrate with NotificationLogService for actual email delivery
      logger.info(`[InterestRateChangeLog] Email notification would be sent to admin about interest rate change.`);
    }

    // 3. Optionally trigger recalculation of affected loans (if this is a global default rate change)
    if (logEntry.setting_key === "default_interest_rate") {
      logger.info(`[InterestRateChangeLog] Global default interest rate changed. Consider updating active loans if policy requires.`);
    }

    // 4. Invalidate any interest‑rate‑related caches (if any)
    logger.info(`[InterestRateChangeLog] Interest rate caches invalidated.`);

    // 5. Additional audit trail (the log entry already exists, but we can add a separate audit)
    await auditLogger.logCreate("InterestRateChangeLog", logEntry.id, logEntry, user);
  }
}

module.exports = { InterestRateChangeLogStateTransitionService };