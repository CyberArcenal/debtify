// src/services/SystemSettingStateTransitionService.js
const { SystemSetting } = require("../entities/systemSettings");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");

// Simple in-memory cache (could be replaced with a more robust solution)
const settingsCache = {};

// Map of known setting keys to their default values
const DEFAULTS = {
  // General
  company_name: "Debtify",
  branch_location: "",
  default_timezone: "Asia/Manila",
  currency: "PHP",
  language: "en",
  receipt_footer_message: "",
  auto_logout_minutes: 30,
  date_format: "YYYY-MM-DD",
  // Collections
  default_interest_rate: 10,
  default_penalty_rate: 2,
  penalty_calculation_method: "percentage",
  enable_auto_penalty: true,
  penalty_grace_days: 0,
  overdue_reminder_days: [7, 3, 1],
  max_loan_amount: 0,
  min_loan_amount: 0,
  enforce_credit_check: false,
  // Loans
  allowed_loan_statuses: ["active", "paid", "overdue", "defaulted"],
  enable_partial_payment: true,
  enable_early_payment_discount: false,
  early_payment_discount_rate: 0,
  require_loan_agreement: false,
  loan_agreement_template: "",
  amortization_type: "flat",
  default_loan_term_months: 12,
  // Notifications
  email_enabled: false,
  sms_enabled: false,
  sms_provider: "twilio",
  reminder_days_before_due: [7, 3, 1],
  overdue_notification_frequency: "daily",
  notify_on_payment: true,
  notify_on_penalty: true,
  email_smtp_host: "",
  email_smtp_port: 587,
  email_smtp_username: "",
  email_smtp_password: "",
  email_from_address: "",
  email_from_name: "",
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
  twilio_messaging_service_sid: "",
  // Reports
  export_formats: ["CSV", "Excel", "PDF"],
  default_export_format: "CSV",
  auto_backup_enabled: false,
  backup_schedule: "0 2 * * *",
  backup_location: "./backups",
  data_retention_days: 365,
  include_audit_in_backup: false,
  // Integrations
  accounting_integration_enabled: false,
  accounting_api_url: "",
  accounting_api_key: "",
  credit_bureau_api_enabled: false,
  credit_bureau_api_key: "",
  credit_bureau_endpoint: "",
  webhooks_enabled: false,
  webhooks: [],
  // Audit & Security
  audit_log_enabled: true,
  log_retention_days: 30,
  log_events: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
  force_https: false,
  session_encryption_enabled: true,
  gdpr_compliance_enabled: false,
  require_mfa_for_admin: false,
};

class SystemSettingStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.settingRepo = dataSource.getRepository(SystemSetting);
  }

  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Reload a service that depends on settings
   */
  async _reloadService(settingKey) {
    if (settingKey.startsWith("email_") || settingKey === "email_enabled") {
      try {
        const emailSender = require("../channels/email.sender");
        // No direct reload method; we'll just log that settings changed.
        logger.info(`[SystemSetting] Email settings changed, will affect future sends.`);
      } catch (err) {
        logger.error(`Failed to reload email service:`, err);
      }
    }
    if (settingKey.startsWith("twilio_") || settingKey === "sms_enabled") {
      try {
        // SMS service would be reloaded similarly
        logger.info(`[SystemSetting] SMS settings changed.`);
      } catch (err) {
        logger.error(`Failed to reload SMS service:`, err);
      }
    }
    if (settingKey === "currency") {
      // Notify frontend to refresh currency formatting (via event or cache)
      logger.info(`[SystemSetting] Currency changed to ${settingsCache[settingKey]}, UI should refresh.`);
      // You could emit an event through IPC to the renderer here.
    }
  }

  /**
   * Apply a setting change (invalidate cache, reload services)
   */
  async onApply(setting, oldValue, newValue, user = "system", queryRunner = null) {
    logger.info(`[Transition] Applying setting change for key "${setting.key}": ${oldValue} → ${newValue} by ${user}`);

    // 1. Invalidate cache
    delete settingsCache[setting.key];

    // 2. If setting affects a service, reload that service
    await this._reloadService(setting.key);

    // 3. Write to audit log
    await auditLogger.logUpdate("SystemSetting", setting.id, { oldValue, newValue }, { applied: true }, user);
  }

  /**
   * Reset setting to factory default
   */
  async onReset(setting, user = "system", queryRunner = null) {
    logger.info(`[Transition] Resetting setting "${setting.key}" to default by ${user}`);

    // 1. Fetch default value from constants
    const defaultValue = DEFAULTS[setting.key];
    if (defaultValue === undefined) {
      throw new Error(`No default value defined for key: ${setting.key}`);
    }

    // 2. Save and apply
    const repo = this._getRepo(SystemSetting, queryRunner);
    const oldValue = setting.value;
    setting.value = this._prepareValueForStorage(defaultValue);
    setting.updatedAt = new Date();
    await repo.save(setting);

    // 3. Invalidate cache and reload affected services
    delete settingsCache[setting.key];
    await this._reloadService(setting.key);

    // 4. Log reset
    await auditLogger.logUpdate("SystemSetting", setting.id, { reset: true, oldValue }, { newValue: defaultValue }, user);
  }

  /**
   * Validate a proposed value before applying
   * @returns {Promise<{ valid: boolean; errorMessage?: string }>}
   */
  async onValidate(setting, proposedValue) {
    logger.info(`[Transition] Validating setting "${setting.key}" with value ${proposedValue}`);

    // Convert to string for validation
    const valueStr = String(proposedValue).trim();
    const key = setting.key;

    // Type‑specific validation
    if (key === "email_enabled" || key === "sms_enabled" || key === "enable_auto_penalty" ||
        key === "enforce_credit_check" || key === "enable_partial_payment" ||
        key === "enable_early_payment_discount" || key === "require_loan_agreement" ||
        key === "auto_backup_enabled" || key === "include_audit_in_backup" ||
        key === "audit_log_enabled" || key === "force_https" || key === "session_encryption_enabled" ||
        key === "gdpr_compliance_enabled" || key === "require_mfa_for_admin" ||
        key === "webhooks_enabled" || key === "accounting_integration_enabled" ||
        key === "credit_bureau_api_enabled") {
      // Boolean: accept true/false, 1/0, yes/no
      const boolVal = valueStr.toLowerCase();
      if (["true", "false", "1", "0", "yes", "no"].includes(boolVal)) {
        return { valid: true };
      }
      return { valid: false, errorMessage: "Must be a boolean (true/false, yes/no, 1/0)" };
    }

    // Numeric values (integers or decimals)
    if (["default_interest_rate", "default_penalty_rate", "penalty_grace_days", "max_loan_amount", "min_loan_amount",
         "early_payment_discount_rate", "default_loan_term_months", "email_smtp_port", "auto_logout_minutes",
         "log_retention_days", "data_retention_days"].includes(key)) {
      const num = parseFloat(valueStr);
      if (isNaN(num)) {
        return { valid: false, errorMessage: "Must be a number" };
      }
      if (key === "email_smtp_port" && (num < 1 || num > 65535)) {
        return { valid: false, errorMessage: "Port must be between 1 and 65535" };
      }
      if (key === "default_interest_rate" && (num < 0 || num > 100)) {
        return { valid: false, errorMessage: "Interest rate must be between 0 and 100" };
      }
      if (key === "default_penalty_rate" && (num < 0 || num > 100)) {
        return { valid: false, errorMessage: "Penalty rate must be between 0 and 100" };
      }
      if (key === "early_payment_discount_rate" && (num < 0 || num > 100)) {
        return { valid: false, errorMessage: "Discount rate must be between 0 and 100" };
      }
      if (key === "auto_logout_minutes" && (num < 0 || num > 1440)) {
        return { valid: false, errorMessage: "Auto logout must be between 0 and 1440 minutes" };
      }
      if (key === "data_retention_days" && num < 0) {
        return { valid: false, errorMessage: "Retention days cannot be negative" };
      }
      return { valid: true };
    }

    // Email address validation
    if (key === "email_from_address" && valueStr !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(valueStr)) {
        return { valid: false, errorMessage: "Invalid email address format" };
      }
    }

    // JSON array validation (for arrays stored as JSON)
    if (key === "allowed_loan_statuses" || key === "export_formats" || key === "log_events" ||
        key === "overdue_reminder_days" || key === "reminder_days_before_due" || key === "webhooks") {
      try {
        JSON.parse(valueStr);
      } catch (err) {
        return { valid: false, errorMessage: "Must be a valid JSON array" };
      }
    }

    // Timezone validation (simple check)
    if (key === "default_timezone") {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: valueStr });
      } catch (err) {
        return { valid: false, errorMessage: "Invalid timezone" };
      }
    }

    // For all other string keys, just accept any non‑empty string (or allow empty if optional)
    if (typeof proposedValue === "string" && (valueStr !== "" || key === "branch_location" || key === "receipt_footer_message")) {
      return { valid: true };
    }

    return { valid: true }; // default accept
  }

  _prepareValueForStorage(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }
}

module.exports = { SystemSettingStateTransitionService };