// src/scheduler/interestAccrualScheduler.js
//@ts-check
const interestAccrualService = require("../services/InterestAccrualService");
const { logger } = require("../utils/logger");

class InterestAccrualScheduler {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 24 * 60 * 60 * 1000; // daily
  }

  async start() {
    logger.info("🚀 Starting Interest Accrual Scheduler (daily)");
    // Run once on startup
    await interestAccrualService.runAccrual();
    // Then schedule daily
    this.intervalId = setInterval(async () => {
      await interestAccrualService.runAccrual();
    }, this.checkInterval);
    logger.info("✅ Interest Accrual Scheduler started");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Interest Accrual Scheduler stopped");
    }
  }
}

module.exports = InterestAccrualScheduler;