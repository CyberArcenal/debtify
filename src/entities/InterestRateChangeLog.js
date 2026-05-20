// src/main/entities/InterestRateChangeLog.js
const { EntitySchema } = require("typeorm");

const InterestRateChangeLog = new EntitySchema({
  name: "InterestRateChangeLog",
  tableName: "interest_rate_change_logs",
  columns: {
    id: { type: Number, primary: true, generated: true },
    // Which interest rate was changed: "default_interest_rate" or "loan_123"
    setting_key: { type: String, nullable: false },
    old_value: { type: "decimal", precision: 5, scale: 2, nullable: true },
    new_value: { type: "decimal", precision: 5, scale: 2, nullable: true },
    changed_by: { type: String, default: "system" },
    reason: { type: "text", nullable: true },
    changed_at: { type: Date, createDate: true },
    // Optional: reference to the loan if it's a per‑loan change
    loan_id: { type: Number, nullable: true },
  },
  indices: [
    { name: "idx_ir_log_key", columns: ["setting_key"] },
    { name: "idx_ir_log_changed_by", columns: ["changed_by"] },
    { name: "idx_ir_log_changed_at", columns: ["changed_at"] },
  ],
});

module.exports = InterestRateChangeLog;