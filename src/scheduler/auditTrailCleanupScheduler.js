// src/scheduler/auditTrailCleanupScheduler.js
//@ts-check

const { AuditLog } = require("../entities/AuditLog");
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const { auditLogEnabled, logRetentionDays } = require("../utils/system");
const notificationService = require("../services/Notification");
const { BrowserWindow } = require("electron");

class AuditTrailCleanupScheduler {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.isEnabled = true;
    this.intervalId = null;
    this.startupTimeoutId = null;
    this.startupDelay = 10000; // 10 seconds (can be made configurable later)
  }

  /**
   * Send event to all renderer windows
   * @param {string} channel
   * @param {{ status: string; retentionDays?: number; cutoffDate?: string; timestamp: string; deletedCount?: number; message?: string; error?: any; }} data
   */
  _sendToRenderers(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }

  async start() {
    try {
      this.isEnabled = await auditLogEnabled();

      if (!this.isEnabled) {
        logger.info("⏸️ Audit Trail Cleanup Scheduler is disabled (audit log disabled)");
        return this;
      }

      logger.info("🚀 Starting Audit Trail Cleanup Scheduler...");
      logger.info(`⏳ Waiting ${this.startupDelay / 1000} seconds before first cleanup...`);

      // Schedule first cleanup after delay
      this.startupTimeoutId = setTimeout(async () => {
        // Ensure database is ready before proceeding
        if (!AppDataSource.isInitialized) {
          logger.warn("[AUDIT CLEANUP] Database not ready, skipping first cleanup");
          // Retry after another 5 seconds?
          setTimeout(() => this.cleanupOldAuditTrails(), 5000);
          return;
        }
        await this.cleanupOldAuditTrails();
        // Start periodic interval only after first cleanup completes
        this.intervalId = setInterval(async () => {
          await this.cleanupOldAuditTrails();
        }, this.checkInterval);
        logger.info(`✅ Audit cleanup interval started (every ${this.checkInterval / (1000 * 60 * 60)} hours)`);
      }, this.startupDelay);

      logger.info("✅ Audit Trail Cleanup Scheduler initialized (first run delayed)");
      return this;
    } catch (error) {
      // @ts-ignore
      logger.error("❌ Failed to start Audit Trail Cleanup Scheduler:", error);
      throw error;
    }
  }

  async stop() {
    if (this.startupTimeoutId) {
      clearTimeout(this.startupTimeoutId);
      this.startupTimeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Audit Trail Cleanup Scheduler Stopped");
    }
  }

  async cleanupOldAuditTrails() {
    try {
      this.isEnabled = await auditLogEnabled();
      if (!this.isEnabled) {
        logger.debug("[AUDIT CLEANUP] Audit log disabled, skipping cleanup");
        return;
      }

      // Extra safety: ensure DB is ready
      if (!AppDataSource.isInitialized) {
        logger.warn("[AUDIT CLEANUP] Database not ready, skipping this run");
        return;
      }

      const retentionDays = await logRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      logger.info(`[AUDIT CLEANUP] Cleaning up audit trails older than ${retentionDays} days (before ${cutoffDate.toISOString()})`);

      this._sendToRenderers("audit:cleanup", {
        status: "started",
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      const auditLogRepo = AppDataSource.getRepository(AuditLog);

      const count = await auditLogRepo
        .createQueryBuilder("audit_logs")
        .where("audit_logs.timestamp < :cutoffDate", { cutoffDate })
        .getCount();

      if (count === 0) {
        logger.debug("[AUDIT CLEANUP] No old audit trail records to delete");
        this._sendToRenderers("audit:cleanup", {
          status: "completed",
          deletedCount: 0,
          retentionDays,
          message: "No old records to delete",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await auditLogRepo
        .createQueryBuilder("audit_logs")
        .where("audit_logs.timestamp < :cutoffDate", { cutoffDate })
        .delete()
        .execute();

      const deletedCount = result.affected || 0;
      logger.info(`✅ Deleted ${deletedCount} audit trail records older than ${retentionDays} days`);

      // In-app notification
      await notificationService.create(
        {
          userId: 1,
          title: "Audit Log Cleanup",
          message: `${deletedCount} old audit record(s) older than ${retentionDays} days have been deleted.`,
          type: "info",
          metadata: {
            deletedCount,
            retentionDays,
            cutoffDate: cutoffDate.toISOString(),
          },
        },
        "system"
      );

      this._sendToRenderers("audit:cleanup", {
        status: "completed",
        deletedCount,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        timestamp: new Date().toISOString(),
      });

      await this.logCleanupAction(retentionDays, deletedCount);
    } catch (error) {
      // @ts-ignore
      logger.error("❌ Error during audit trail cleanup:", error);
      this._sendToRenderers("audit:cleanup", {
        status: "failed",
        // @ts-ignore
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      await notificationService.create(
        {
          userId: 1,
          title: "Audit Log Cleanup Failed",
          // @ts-ignore
          message: `Failed to clean up old audit logs: ${error.message}`,
          type: "error",
          // @ts-ignore
          metadata: { error: error.message },
        },
        "system"
      ).catch(notifErr => logger.warn("Could not send failure notification", notifErr));
    }
  }

  /**
   * @param {number} retentionDays
   * @param {number} deletedCount
   */
  async logCleanupAction(retentionDays, deletedCount) {
    try {
      const auditLogRepo = AppDataSource.getRepository(AuditLog);
      const auditEntry = auditLogRepo.create({
        action: "AUDIT_CLEANUP",
        entity: "AuditTrail",
        entityId: null,
        oldData: null,
        newData: JSON.stringify({
          retention_days: retentionDays,
          deleted_count: deletedCount,
          cutoff_date: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString(),
        }),
        user: "system",
        timestamp: new Date(),
      });
      await auditLogRepo.save(auditEntry);
    } catch (error) {
      // @ts-ignore
      logger.warn("Could not log audit cleanup action:", error);
    }
  }

  async forceCleanup() {
    logger.info("🔄 Force audit trail cleanup triggered");
    await this.cleanupOldAuditTrails();
  }

  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isRunning: !!this.intervalId,
      startupPending: !!this.startupTimeoutId,
      checkInterval: this.checkInterval,
      lastRun: new Date(),
      nextRun: this.intervalId ? new Date(Date.now() + this.checkInterval) : null,
    };
  }

  async updateConfig() {
    this.isEnabled = await auditLogEnabled();
    logger.info("🔄 Updated audit cleanup configuration from system settings");
  }

  async getCleanupStats() {
    try {
      const auditLogRepo = AppDataSource.getRepository(AuditLog);
      const retentionDays = await logRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldRecordsCount = await auditLogRepo
        .createQueryBuilder("audit_logs")
        .where("audit_logs.timestamp < :cutoffDate", { cutoffDate })
        .getCount();

      const totalCount = await auditLogRepo.count();

      const oldestRecord = await auditLogRepo
        .createQueryBuilder("audit_logs")
        .select("MIN(audit_logs.timestamp)", "oldest")
        .getRawOne();

      return {
        total_records: totalCount,
        old_records_to_delete: oldRecordsCount,
        retention_days: retentionDays,
        cutoff_date: cutoffDate.toISOString(),
        oldest_record_date: oldestRecord?.oldest || null,
        cleanup_enabled: this.isEnabled,
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error getting cleanup stats:", error);
      return null;
    }
  }
}

module.exports = AuditTrailCleanupScheduler;