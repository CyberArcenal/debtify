// src/scheduler/zeroBalanceFixerScheduler.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const notificationService = require("../services/Notification");
const Debt = require("../entities/Debt");

class ZeroBalanceFixerScheduler {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.intervalId = null;
    this.lastRunKey = "zero_balance_fixer_last_run";
  }

  async start() {
    try {
      logger.info("🚀 Starting Zero Balance Fixer Scheduler...");
      // Run once on startup
      await this.fixZeroBalanceDebts();
      // Schedule daily
      this.intervalId = setInterval(async () => {
        await this.fixZeroBalanceDebts();
      }, this.checkInterval);
      logger.info(`✅ Zero Balance Fixer Scheduler started (interval: ${this.checkInterval / (1000 * 60 * 60)} hours)`);
      return this;
    } catch (error) {
      logger.error("❌ Failed to start Zero Balance Fixer Scheduler:", error);
      throw error;
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Zero Balance Fixer Scheduler stopped");
    }
  }

  /**
   * Check if we already ran today (to avoid duplicate runs)
   */
  async alreadyRanToday() {
    const { SystemSetting } = require("../entities/systemSettings");
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    const lastRun = await settingRepo.findOne({ where: { key: this.lastRunKey } });
    if (!lastRun) return false;
    const lastRunDate = new Date(lastRun.value);
    const today = new Date();
    return (
      lastRunDate.getDate() === today.getDate() &&
      lastRunDate.getMonth() === today.getMonth() &&
      lastRunDate.getFullYear() === today.getFullYear()
    );
  }

  async markRanToday() {
    const { SystemSetting } = require("../entities/systemSettings");
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    let setting = await settingRepo.findOne({ where: { key: this.lastRunKey } });
    if (setting) {
      setting.value = new Date().toISOString();
      setting.updated_at = new Date();
    } else {
      setting = settingRepo.create({
        key: this.lastRunKey,
        value: new Date().toISOString(),
        setting_type: "collections",
        is_public: false,
      });
    }
    await settingRepo.save(setting);
  }

  async fixZeroBalanceDebts() {
    try {
      // Skip if already ran today
      if (await this.alreadyRanToday()) {
        logger.debug("[ZERO BALANCE FIXER] Already ran today, skipping");
        return;
      }

      if (!AppDataSource.isInitialized) {
        logger.warn("[ZERO BALANCE FIXER] Database not ready, skipping");
        return;
      }

      logger.info("[ZERO BALANCE FIXER] Scanning for debts with zero remaining balance but not paid...");

      const debtRepo = AppDataSource.getRepository(Debt);

      // Find debts where remainingAmount <= 0, status is NOT 'paid', and not deleted
      const debtsToFix = await debtRepo
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where("debt.remainingAmount <= 0")
        .andWhere("debt.status != :paidStatus", { paidStatus: "paid" })
        .andWhere("debt.deletedAt IS NULL")
        .getMany();

      if (debtsToFix.length === 0) {
        logger.debug("[ZERO BALANCE FIXER] No debts with zero balance and incorrect status found");
        await this.markRanToday();
        return;
      }

      logger.info(`[ZERO BALANCE FIXER] Found ${debtsToFix.length} debt(s) to fix`);

      let fixedCount = 0;

      for (const debt of debtsToFix) {
        const oldStatus = debt.status;
        // Update status to 'paid'
        debt.status = "paid";
        debt.updatedAt = new Date();
        await debtRepo.save(debt);

        // Audit log
        await auditLogger.logUpdate(
          "Debt",
          debt.id,
          { status: oldStatus, remainingAmount: debt.remainingAmount },
          { status: "paid", reason: "Auto-corrected because remaining amount is zero" },
          "system"
        );

        // In-app notification (optional)
        await notificationService.create(
          {
            userId: 1, // system user
            title: "Debt Status Corrected",
            message: `Debt "${debt.name}" (ID: ${debt.id}) had remaining amount ≤ 0 but status was "${oldStatus}". Status changed to "paid".`,
            type: "info",
            metadata: { debtId: debt.id, oldStatus, newStatus: "paid" },
          },
          "system"
        ).catch(err => logger.warn("Could not send notification for debt fix", err));

        logger.info(`[ZERO BALANCE FIXER] Debt #${debt.id} fixed: ${oldStatus} → paid (remaining: ${debt.remainingAmount})`);
        fixedCount++;
      }

      // Summary audit log
      await auditLogger.logExport(
        "ZeroBalanceFixerScheduler",
        "auto_correction",
        {
          fixed: fixedCount,
          date: new Date().toISOString(),
        },
        "system"
      );

      logger.info(`[ZERO BALANCE FIXER] Completed: ${fixedCount} debt(s) corrected to 'paid'`);
      await this.markRanToday();
    } catch (error) {
      logger.error("[ZERO BALANCE FIXER] Error during fix:", error);
    }
  }

  async forceRun() {
    logger.info("🔄 Force zero balance fixer triggered");
    await this.fixZeroBalanceDebts();
  }

  getStatus() {
    return {
      isRunning: !!this.intervalId,
      checkInterval: this.checkInterval,
      nextRun: this.intervalId ? new Date(Date.now() + this.checkInterval) : null,
    };
  }
}

module.exports = ZeroBalanceFixerScheduler;