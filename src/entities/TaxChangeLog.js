// src/main/entities/TaxChangeLog.js
const { EntitySchema } = require("typeorm");

const TaxChangeLog = new EntitySchema({
  name: "TaxChangeLog",
  tableName: "tax_change_logs",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    // Which tax setting was changed (e.g., "tax_rate", "tax_enabled")
    setting_key: {
      type: String,
      nullable: false,
    },
    // Old value before change (as string)
    old_value: {
      type: "text",
      nullable: true,
    },
    // New value after change (as string)
    new_value: {
      type: "text",
      nullable: true,
    },
    // User who made the change (e.g., username or system)
    changed_by: {
      type: String,
      default: "system",
    },
    // Optional note/reason for the change
    reason: {
      type: "text",
      nullable: true,
    },
    // Timestamp of change
    changed_at: {
      type: Date,
      createDate: true,
    },
    // Optional: link to the main system setting record (if any)
    setting_id: {
      type: Number,
      nullable: true,
    },
  },
  indices: [
    { name: "idx_tax_log_setting_key", columns: ["setting_key"] },
    { name: "idx_tax_log_changed_by", columns: ["changed_by"] },
    { name: "idx_tax_log_changed_at", columns: ["changed_at"] },
  ],
});

module.exports = TaxChangeLog;