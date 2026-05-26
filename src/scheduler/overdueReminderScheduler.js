// src/scheduler/overdueReminderScheduler.js
//@ts-check

const { AppDataSource } = require("../main/db/data-source");
const emailSender = require("../channels/email.sender");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const { SystemSetting } = require("../entities/systemSettings");
const Debt = require("../entities/Debt");
const { overdueReminderDays } = require("../utils/system");

class OverdueReminderScheduler {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.intervalId = null;
    this.isEnabled = true;
    this.lastRunKey = "overdue_reminder_last_run";
  }

  async start() {
    try {
      // Check if feature is enabled via system setting (default true)
      const enabledSetting = await this.getSystemSetting(
        "overdue_reminder_enabled",
        // @ts-ignore
        "true",
      );
      this.isEnabled = enabledSetting === "true";

      if (!this.isEnabled) {
        logger.info("⏸️ Overdue Reminder Scheduler is disabled");
        return this;
      }

      logger.info("🚀 Starting Overdue Reminder Scheduler...");

      // Run once on startup (but only if not already run today)
      await this.sendOverdueReminders();

      // Schedule daily
      this.intervalId = setInterval(async () => {
        await this.sendOverdueReminders();
      }, this.checkInterval);

      // @ts-ignore
      logger.info("✅ Overdue Reminder Scheduler Started", {
        checkInterval: `${this.checkInterval / (1000 * 60 * 60)} hours`,
      });
      return this;
    } catch (error) {
      // @ts-ignore
      logger.error("❌ Failed to start Overdue Reminder Scheduler:", error);
      throw error;
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Overdue Reminder Scheduler Stopped");
    }
  }

  /**
   * Get a system setting value
   */
  // @ts-ignore
  async getSystemSetting(key, defaultValue = null) {
    try {
      if (!AppDataSource.isInitialized) return defaultValue;
      const settingRepo = AppDataSource.getRepository(SystemSetting);
      const setting = await settingRepo.findOne({ where: { key } });
      return setting ? setting.value : defaultValue;
    } catch (err) {
      // @ts-ignore
      logger.warn(`Failed to read setting ${key}:`, err);
      return defaultValue;
    }
  }

  /**
   * Set a system setting
   */
  // @ts-ignore
  async setSystemSetting(key, value) {
    try {
      if (!AppDataSource.isInitialized) return;
      const settingRepo = AppDataSource.getRepository(SystemSetting);
      let setting = await settingRepo.findOne({ where: { key } });
      if (setting) {
        setting.value = value;
        setting.updated_at = new Date();
      } else {
        setting = settingRepo.create({
          key,
          value,
          setting_type: "notifications",
          is_public: false,
        });
      }
      await settingRepo.save(setting);
    } catch (err) {
      // @ts-ignore
      logger.warn(`Failed to save setting ${key}:`, err);
    }
  }

  /**
   * Check if we already ran today
   */
  async alreadyRanToday() {
    // @ts-ignore
    const lastRun = await this.getSystemSetting(this.lastRunKey, "");
    if (!lastRun) return false;
    // @ts-ignore
    const lastRunDate = new Date(lastRun);
    const today = new Date();
    return (
      lastRunDate.getDate() === today.getDate() &&
      lastRunDate.getMonth() === today.getMonth() &&
      lastRunDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Mark today as the last run
   */
  async markRanToday() {
    await this.setSystemSetting(this.lastRunKey, new Date().toISOString());
  }

  /**
   * Main logic: find overdue debts and send reminders **only** on configured days overdue
   */
  async sendOverdueReminders() {
    try {
      // Skip if already ran today
      if (await this.alreadyRanToday()) {
        logger.debug("[OVERDUE REMINDER] Already ran today, skipping");
        return;
      }

      logger.info("[OVERDUE REMINDER] Checking for overdue debts...");

      // Ensure DB is initialized
      if (!AppDataSource.isInitialized) {
        logger.warn("[OVERDUE REMINDER] Database not ready, skipping");
        return;
      }

      const debtRepo = AppDataSource.getRepository(Debt);
      const now = new Date();

      // Find debts that:
      // - dueDate < current date
      // - status NOT in ['paid', 'defaulted']
      // - deletedAt IS NULL
      // - have borrower email
      const overdueDebts = await debtRepo
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where("debt.dueDate < :now", { now })
        .andWhere("debt.deletedAt IS NULL")
        .andWhere("debt.status NOT IN ('paid', 'defaulted')")
        .andWhere("borrower.email IS NOT NULL")
        .andWhere("borrower.email != ''")
        .getMany();

      if (overdueDebts.length === 0) {
        logger.info("[OVERDUE REMINDER] No overdue debts found");
        await this.markRanToday();
        return;
      }

      // Get the configured reminder days (e.g., [7, 3, 1])
      const reminderDays = await overdueReminderDays();
      if (!reminderDays || reminderDays.length === 0) {
        logger.warn(
          "[OVERDUE REMINDER] overdue_reminder_days setting is empty, no reminders will be sent",
        );
        await this.markRanToday();
        return;
      }

      logger.info(
        `[OVERDUE REMINDER] Found ${overdueDebts.length} overdue debt(s). Reminder days: ${reminderDays.join(", ")}`,
      );

      let sentCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const debt of overdueDebts) {
        // @ts-ignore
        const borrower = debt.borrower;
        if (!borrower || !borrower.email) continue;

        // Calculate days overdue (positive integer, 1 = first day overdue)
        // @ts-ignore
        const dueDate = new Date(debt.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor(
          // @ts-ignore
          (today - dueDate) / (1000 * 60 * 60 * 24),
        );

        // Only send if daysOverdue is exactly one of the configured reminder days
        if (!reminderDays.includes(daysOverdue)) {
          logger.debug(
            `[OVERDUE REMINDER] Debt #${debt.id} is ${daysOverdue} days overdue – not a configured reminder day, skipping`,
          );
          skippedCount++;
          continue;
        }

        const subject = `Overdue Payment Reminder - ${debt.name}`;
        // @ts-ignore
        const remaining = (debt.totalAmount - debt.paidAmount).toFixed(2);
        const html = `
          <div style="font-family: Arial, sans-serif;">
            <h2>Overdue Payment Reminder</h2>
            <p>Dear ${borrower.name},</p>
            <p>This is a reminder that your following debt is <strong style="color: red;">OVERDUE</strong> (${daysOverdue} day(s)):</p>
            <ul>
              <li><strong>Debt Name:</strong> ${debt.name}</li>
              <li><strong>Total Amount:</strong> ₱${
// @ts-ignore
              debt.totalAmount.toFixed(2)}</li>
              <li><strong>Amount Paid:</strong> ₱${
// @ts-ignore
              debt.paidAmount.toFixed(2)}</li>
              <li><strong>Remaining Balance:</strong> ₱${remaining}</li>
              <li><strong>Due Date:</strong> ${new Date(
// @ts-ignore
              debt.dueDate).toLocaleDateString()}</li>
              <li><strong>Status:</strong> ${
// @ts-ignore
              debt.status.toUpperCase()}</li>
            </ul>
            <p>Please settle the overdue amount as soon as possible to avoid further penalties.</p>
            <hr />
            <p><em>This is an automated reminder. Please contact your loan officer for any inquiries.</em></p>
          </div>
        `;
        const text = `
          Overdue Payment Reminder
          Dear ${borrower.name},
          Your debt "${debt.name}" is OVERDUE (${daysOverdue} day(s)).
          Total: ₱${
// @ts-ignore
          debt.totalAmount.toFixed(2)} | Paid: ₱${debt.paidAmount.toFixed(2)} | Remaining: ₱${remaining}
          Due Date: ${new Date(
// @ts-ignore
          debt.dueDate).toLocaleDateString()}
          Please settle immediately.
        `;

        try {
          const result = await emailSender.send(
            borrower.email,
            subject,
            html,
            text,
            {},
            true, // async mode
          );
          if (result.success) {
            sentCount++;
            logger.info(
              `✅ Reminder sent to ${borrower.email} for debt #${debt.id} (${daysOverdue} days overdue)`,
            );
            // Optionally update debt status to 'overdue' if not already set
            if (debt.status !== "overdue") {
              debt.status = "overdue";
              await debtRepo.save(debt);
            }
          } else {
            failedCount++;
            logger.warn(
              // @ts-ignore
              `❌ Failed to send to ${borrower.email}: ${result.error}`,
            );
          }
        } catch (error) {
          failedCount++;
          // @ts-ignore
          logger.error(`Error sending email to ${borrower.email}:`, error);
        }
      }

      await auditLogger.logExport(
        "OverdueReminder",
        "email",
        // @ts-ignore
        {
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
          reminderDays,
          date: new Date().toISOString(),
        },
        "system",
      );

      logger.info(
        `[OVERDUE REMINDER] Completed: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped (not a reminder day)`,
      );

      // Mark as run today even if some failed, to avoid re-running same day
      await this.markRanToday();
    } catch (error) {
      // @ts-ignore
      logger.error("[OVERDUE REMINDER] Error during cleanup:", error);
    }
  }

  /**
   * Force a manual run (e.g., from admin panel)
   */
  async forceRun() {
    logger.info("🔄 Force overdue reminder run triggered");
    await this.sendOverdueReminders();
  }

  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isRunning: !!this.intervalId,
      checkInterval: this.checkInterval,
      lastRun: null,
      nextRun: this.intervalId
        ? new Date(Date.now() + this.checkInterval)
        : null,
    };
  }
}

module.exports = OverdueReminderScheduler;
