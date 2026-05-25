// src/scheduler/overdueStatusUpdater.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const Debt = require("../entities/Debt");
const { DebtStateTransitionService } = require("../StateTransitionServices/Debt");

class OverdueStatusUpdater {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.intervalId = null;
    this.lastRunKey = "overdue_status_last_run";
  }

  async start() {
    try {
      logger.info("🚀 Starting Overdue Status Updater Scheduler...");

      // Run once on startup (but only if not already run today)
      await this.updateOverdueStatuses();

      // Schedule daily
      this.intervalId = setInterval(async () => {
        await this.updateOverdueStatuses();
      }, this.checkInterval);

      logger.info(
        `✅ Overdue Status Updater started (interval: ${this.checkInterval / (1000 * 60 * 60)} hours)`,
      );
      return this;
    } catch (error) {
      // @ts-ignore
      logger.error("❌ Failed to start Overdue Status Updater:", error);
      throw error;
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Overdue Status Updater stopped");
    }
  }

  /**
   * Check if we already ran today
   */
  async alreadyRanToday() {
    const settingRepo = AppDataSource.getRepository(
      require("../entities/systemSettings").SystemSetting,
    );
    const lastRun = await settingRepo.findOne({
      where: { key: this.lastRunKey },
    });
    if (!lastRun) return false;
    // @ts-ignore
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
    let setting = await settingRepo.findOne({
      where: { key: this.lastRunKey },
    });
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

  async updateOverdueStatuses() {
    try {
      if (await this.alreadyRanToday()) {
        logger.debug("[OVERDUE STATUS] Already ran today, skipping");
        return;
      }

      if (!AppDataSource.isInitialized) {
        logger.warn("[OVERDUE STATUS] Database not ready, skipping");
        return;
      }

      logger.info(
        "[OVERDUE STATUS] Checking for debts that should become overdue...",
      );

      const debtRepo = AppDataSource.getRepository(Debt);
      const now = new Date();

      // Hanapin ang mga active debts na dueDate < ngayon, remainingAmount > 0, at hindi pa overdue
      const debtsToUpdate = await debtRepo
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where("debt.status = :status", { status: "active" })
        .andWhere("debt.dueDate < :now", { now })
        .andWhere("debt.remainingAmount > 0")
        .andWhere("debt.deletedAt IS NULL")
        .getMany();

      if (debtsToUpdate.length === 0) {
        logger.info("[OVERDUE STATUS] No debts need to be marked overdue");
        await this.markRanToday();
        return;
      }

      logger.info(
        `[OVERDUE STATUS] Found ${debtsToUpdate.length} debts to mark as overdue`,
      );

      const transitionService = new DebtStateTransitionService(AppDataSource);
      let updatedCount = 0;

      for (const debt of debtsToUpdate) {
        try {
          // Tawagin ang onOverdue transition (magse-set ng status, mag-aapply ng penalty, magse-send ng email)
          await transitionService.onOverdue(debt, "system");
          updatedCount++;
          logger.info(`[OVERDUE STATUS] Debt #${debt.id} marked as overdue`);
        } catch (err) {
          logger.error(
            `[OVERDUE STATUS] Failed to update debt #${debt.id}:`,
            // @ts-ignore
            err,
          );
        }
      }

      logger.info(`[OVERDUE STATUS] Completed: ${updatedCount} debts updated`);
      await this.markRanToday();
    } catch (error) {
      // @ts-ignore
      logger.error("[OVERDUE STATUS] Error during update:", error);
    }
  }

  /**
   * Force a manual run
   */
  async forceRun() {
    logger.info("🔄 Force overdue status update triggered");
    await this.updateOverdueStatuses();
  }

  getStatus() {
    return {
      isRunning: !!this.intervalId,
      checkInterval: this.checkInterval,
      nextRun: this.intervalId
        ? new Date(Date.now() + this.checkInterval)
        : null,
    };
  }
}

module.exports = OverdueStatusUpdater;
