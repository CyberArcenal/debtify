// src/utils/system.js
const path = require("path");
const Decimal = require("decimal.js");
const { logger } = require("./logger");
const { SystemSetting, SettingType } = require("../entities/systemSettings");

// ============================================================
// 📊 CORE GETTER FUNCTIONS
// ============================================================

/**
 * Get setting value
 * @param {string} key
 * @param {string} settingType
 * @param {any} defaultValue
 */
async function getValue(key, settingType, defaultValue = null) {
  const { AppDataSource } = require("../main/db/data-source");
  try {
    if (typeof key !== "string" || !key.trim()) {
      logger.debug(`[DB] Invalid key: ${key}`);
      return defaultValue;
    }
    const repository = AppDataSource.getRepository(SystemSetting);
    if (!repository) {
      logger.debug(`[DB] Repository not available, using default: ${defaultValue}`);
      return defaultValue;
    }
    const query = repository
      .createQueryBuilder("setting")
      .where("setting.key = :key", { key: key.toLowerCase() })
      .andWhere("setting.is_deleted = :is_deleted", { is_deleted: false });
    if (settingType) {
      query.andWhere("setting.setting_type = :settingType", { settingType });
    }
    const setting = await query.getOne();
    if (!setting || setting.value === null || setting.value === undefined) {
      logger.debug(`[DB] Setting ${key} not found, using default: ${defaultValue}`);
      return defaultValue;
    }
    return String(setting.value).trim();
  } catch (error) {
    logger.warn(`[DB] Error fetching setting ${key}: ${error.message}, using default: ${defaultValue}`);
    return defaultValue;
  }
}

/**
 * Get boolean setting
 */
async function getBool(key, settingType, defaultValue = false) {
  try {
    const raw = await getValue(key, settingType, defaultValue ? "true" : "false");
    if (raw === null) return defaultValue;
    const normalized = String(raw).trim().toLowerCase();
    if (["true", "1", "yes", "y", "on", "enabled", "active"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off", "disabled", "inactive"].includes(normalized)) return false;
    const num = parseFloat(normalized);
    if (!isNaN(num)) return num > 0;
    logger.warn(`Unrecognized boolean for key='${key}': '${raw}' → using default=${defaultValue}`);
    return defaultValue;
  } catch (error) {
    logger.error(`Error in getBool for ${key}: ${error.message}, using default: ${defaultValue}`);
    return defaultValue;
  }
}

/**
 * Get integer setting
 */
async function getInt(key, settingType, defaultValue = 0) {
  try {
    const raw = await getValue(key, settingType, defaultValue.toString());
    if (raw === null) return defaultValue;
    const result = parseInt(String(raw).trim(), 10);
    return isNaN(result) ? defaultValue : result;
  } catch (error) {
    logger.warn(`Invalid int for key='${key}': ${error.message} – using default=${defaultValue}`);
    return defaultValue;
  }
}

/**
 * Get array setting
 */
async function getArray(key, settingType, defaultValue = []) {
  try {
    const raw = await getValue(key, settingType, JSON.stringify(defaultValue));
    if (raw === null) return defaultValue;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return defaultValue; }
    }
    return defaultValue;
  } catch (error) {
    logger.warn(`Error getting array setting ${key}: ${error.message}, using default`);
    return defaultValue;
  }
}

// ============================================================
// 🏢 GENERAL SETTINGS
// ============================================================

async function companyName() {
  return getValue("company_name", SettingType.GENERAL, "Collectly");
}

async function branchLocation() {
  return getValue("branch_location", SettingType.GENERAL, "");
}

async function defaultTimezone() {
  return getValue("default_timezone", SettingType.GENERAL, "Asia/Manila");
}

async function language() {
  return getValue("language", SettingType.GENERAL, "en");
}

async function currency() {
  return getValue("currency", SettingType.GENERAL, "PHP");
}

async function receiptFooterMessage() {
  return getValue("receipt_footer_message", SettingType.GENERAL, "");
}

async function autoLogoutMinutes() {
  return getInt("auto_logout_minutes", SettingType.GENERAL, 30);
}

async function dateFormat() {
  return getValue("date_format", SettingType.GENERAL, "YYYY-MM-DD");
}

// ============================================================
// 📋 COLLECTIONS SETTINGS
// ============================================================

async function defaultInterestRate() {
  return getInt("default_interest_rate", SettingType.COLLECTIONS, 10);
}

async function defaultPenaltyRate() {
  return parseFloat(await getInt("default_penalty_rate", SettingType.COLLECTIONS, 2));
}

async function penaltyCalculationMethod() {
  return getValue("penalty_calculation_method", SettingType.COLLECTIONS, "percentage");
}

async function enableAutoPenalty() {
  return getBool("enable_auto_penalty", SettingType.COLLECTIONS, true);
}

async function penaltyGraceDays() {
  return getInt("penalty_grace_days", SettingType.COLLECTIONS, 0);
}

async function overdueReminderDays() {
  return getArray("overdue_reminder_days", SettingType.COLLECTIONS, [7, 3, 1]);
}

async function maxLoanAmount() {
  return getInt("max_loan_amount", SettingType.COLLECTIONS, 0);
}

async function minLoanAmount() {
  return getInt("min_loan_amount", SettingType.COLLECTIONS, 0);
}

async function enforceCreditCheck() {
  return getBool("enforce_credit_check", SettingType.COLLECTIONS, false);
}

// ============================================================
// 💰 LOANS SETTINGS
// ============================================================

async function allowedLoanStatuses() {
  return getArray("allowed_loan_statuses", SettingType.LOANS, ["active", "paid", "overdue", "defaulted"]);
}

async function enablePartialPayment() {
  return getBool("enable_partial_payment", SettingType.LOANS, true);
}

async function enableEarlyPaymentDiscount() {
  return getBool("enable_early_payment_discount", SettingType.LOANS, false);
}

async function earlyPaymentDiscountRate() {
  return getInt("early_payment_discount_rate", SettingType.LOANS, 0);
}

async function requireLoanAgreement() {
  return getBool("require_loan_agreement", SettingType.LOANS, false);
}

async function loanAgreementTemplate() {
  return getValue("loan_agreement_template", SettingType.LOANS, "");
}

async function amortizationType() {
  return getValue("amortization_type", SettingType.LOANS, "flat");
}

async function defaultLoanTermMonths() {
  return getInt("default_loan_term_months", SettingType.LOANS, 12);
}

// ============================================================
// 🔔 NOTIFICATION SETTINGS
// ============================================================

async function emailEnabled() {
  return getBool("email_enabled", SettingType.NOTIFICATIONS, false);
}

async function smsEnabled() {
  return getBool("sms_enabled", SettingType.NOTIFICATIONS, false);
}

async function smsProvider() {
  return getValue("sms_provider", SettingType.NOTIFICATIONS, "twilio");
}

async function reminderDaysBeforeDue() {
  return getArray("reminder_days_before_due", SettingType.NOTIFICATIONS, [7, 3, 1]);
}

async function overdueNotificationFrequency() {
  return getValue("overdue_notification_frequency", SettingType.NOTIFICATIONS, "daily");
}

async function notifyOnPayment() {
  return getBool("notify_on_payment", SettingType.NOTIFICATIONS, true);
}

async function notifyOnPenalty() {
  return getBool("notify_on_penalty", SettingType.NOTIFICATIONS, true);
}

// SMTP Settings
async function smtpHost() {
  return getValue("email_smtp_host", SettingType.NOTIFICATIONS, "");
}

async function smtpPort() {
  return getInt("email_smtp_port", SettingType.NOTIFICATIONS, 587);
}

async function smtpUsername() {
  return getValue("email_smtp_username", SettingType.NOTIFICATIONS, "");
}

async function smtpPassword() {
  return getValue("email_smtp_password", SettingType.NOTIFICATIONS, "");
}

async function smtpFromEmail() {
  return getValue("email_from_address", SettingType.NOTIFICATIONS, "");
}

async function smtpFromName() {
  return getValue("email_from_name", SettingType.NOTIFICATIONS, "");
}

async function getSmtpConfig() {
  const [host, port, username, password, fromEmail, fromName] = await Promise.all([
    smtpHost(),
    smtpPort(),
    smtpUsername(),
    smtpPassword(),
    smtpFromEmail(),
    smtpFromName(),
  ]);
  return { host, port, username, password, from: { email: fromEmail, name: fromName } };
}

// Twilio SMS Settings
async function twilioAccountSid() {
  return getValue("twilio_account_sid", SettingType.NOTIFICATIONS, "");
}

async function twilioAuthToken() {
  return getValue("twilio_auth_token", SettingType.NOTIFICATIONS, "");
}

async function twilioPhoneNumber() {
  return getValue("twilio_phone_number", SettingType.NOTIFICATIONS, "");
}

async function twilioMessagingServiceSid() {
  return getValue("twilio_messaging_service_sid", SettingType.NOTIFICATIONS, "");
}

async function getTwilioConfig() {
  const [accountSid, authToken, phoneNumber, messagingServiceSid] = await Promise.all([
    twilioAccountSid(),
    twilioAuthToken(),
    twilioPhoneNumber(),
    twilioMessagingServiceSid(),
  ]);
  return { accountSid, authToken, phoneNumber, messagingServiceSid };
}

// ============================================================
// 📊 REPORTS SETTINGS
// ============================================================

async function exportFormats() {
  return getArray("export_formats", SettingType.REPORTS, ["CSV", "Excel", "PDF"]);
}

async function defaultExportFormat() {
  return getValue("default_export_format", SettingType.REPORTS, "CSV");
}

async function autoBackupEnabled() {
  return getBool("auto_backup_enabled", SettingType.REPORTS, false);
}

async function backupSchedule() {
  return getValue("backup_schedule", SettingType.REPORTS, "0 2 * * *");
}

async function backupLocation() {
  return getValue("backup_location", SettingType.REPORTS, "./backups");
}

async function dataRetentionDays() {
  return getInt("data_retention_days", SettingType.REPORTS, 365);
}

async function includeAuditInBackup() {
  return getBool("include_audit_in_backup", SettingType.REPORTS, false);
}

// ============================================================
// 🔗 INTEGRATIONS SETTINGS
// ============================================================

async function accountingIntegrationEnabled() {
  return getBool("accounting_integration_enabled", SettingType.INTEGRATIONS, false);
}

async function accountingApiUrl() {
  return getValue("accounting_api_url", SettingType.INTEGRATIONS, "");
}

async function accountingApiKey() {
  return getValue("accounting_api_key", SettingType.INTEGRATIONS, "");
}

async function creditBureauApiEnabled() {
  return getBool("credit_bureau_api_enabled", SettingType.INTEGRATIONS, false);
}

async function creditBureauApiKey() {
  return getValue("credit_bureau_api_key", SettingType.INTEGRATIONS, "");
}

async function creditBureauEndpoint() {
  return getValue("credit_bureau_endpoint", SettingType.INTEGRATIONS, "");
}

async function webhooksEnabled() {
  return getBool("webhooks_enabled", SettingType.INTEGRATIONS, false);
}

async function webhooks() {
  return getArray("webhooks", SettingType.INTEGRATIONS, []);
}

// ============================================================
// 🔒 AUDIT & SECURITY SETTINGS
// ============================================================

async function auditLogEnabled() {
  return getBool("audit_log_enabled", SettingType.AUDIT_SECURITY, true);
}

async function logRetentionDays() {
  return getInt("log_retention_days", SettingType.AUDIT_SECURITY, 30);
}

async function logEvents() {
  return getArray("log_events", SettingType.AUDIT_SECURITY, ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"]);
}

async function forceHttps() {
  return getBool("force_https", SettingType.AUDIT_SECURITY, false);
}

async function sessionEncryptionEnabled() {
  return getBool("session_encryption_enabled", SettingType.AUDIT_SECURITY, true);
}

async function gdprComplianceEnabled() {
  return getBool("gdpr_compliance_enabled", SettingType.AUDIT_SECURITY, false);
}

async function requireMfaForAdmin() {
  return getBool("require_mfa_for_admin", SettingType.AUDIT_SECURITY, false);
}

// ============================================================
// 📦 CATEGORY-LEVEL CONVENIENCE FUNCTIONS
// ============================================================

async function getGeneralSettings() {
  const [company_name, branch_location, default_timezone, currency_val, language_val, receipt_footer_message, auto_logout_minutes, date_format] = await Promise.all([
    companyName(),
    branchLocation(),
    defaultTimezone(),
    currency(),
    language(),
    receiptFooterMessage(),
    autoLogoutMinutes(),
    dateFormat(),
  ]);
  return { company_name, branch_location, default_timezone, currency: currency_val, language: language_val, receipt_footer_message, auto_logout_minutes, date_format };
}

async function getCollectionsSettings() {
  const [default_interest_rate, default_penalty_rate, penalty_calculation_method, enable_auto_penalty, penalty_grace_days, overdue_reminder_days, max_loan_amount, min_loan_amount, enforce_credit_check] = await Promise.all([
    defaultInterestRate(),
    defaultPenaltyRate(),
    penaltyCalculationMethod(),
    enableAutoPenalty(),
    penaltyGraceDays(),
    overdueReminderDays(),
    maxLoanAmount(),
    minLoanAmount(),
    enforceCreditCheck(),
  ]);
  return { default_interest_rate, default_penalty_rate, penalty_calculation_method, enable_auto_penalty, penalty_grace_days, overdue_reminder_days, max_loan_amount, min_loan_amount, enforce_credit_check };
}

async function getLoansSettings() {
  const [allowed_loan_statuses, enable_partial_payment, enable_early_payment_discount, early_payment_discount_rate, require_loan_agreement, loan_agreement_template, amortization_type, default_loan_term_months] = await Promise.all([
    allowedLoanStatuses(),
    enablePartialPayment(),
    enableEarlyPaymentDiscount(),
    earlyPaymentDiscountRate(),
    requireLoanAgreement(),
    loanAgreementTemplate(),
    amortizationType(),
    defaultLoanTermMonths(),
  ]);
  return { allowed_loan_statuses, enable_partial_payment, enable_early_payment_discount, early_payment_discount_rate, require_loan_agreement, loan_agreement_template, amortization_type, default_loan_term_months };
}

async function getNotificationsSettings() {
  const [email_enabled, sms_enabled, sms_provider, reminder_days_before_due, overdue_notification_frequency, notify_on_payment, notify_on_penalty] = await Promise.all([
    emailEnabled(),
    smsEnabled(),
    smsProvider(),
    reminderDaysBeforeDue(),
    overdueNotificationFrequency(),
    notifyOnPayment(),
    notifyOnPenalty(),
  ]);
  return { email_enabled, sms_enabled, sms_provider, reminder_days_before_due, overdue_notification_frequency, notify_on_payment, notify_on_penalty };
}

async function getReportsSettings() {
  const [export_formats, default_export_format, auto_backup_enabled, backup_schedule, backup_location, data_retention_days, include_audit_in_backup] = await Promise.all([
    exportFormats(),
    defaultExportFormat(),
    autoBackupEnabled(),
    backupSchedule(),
    backupLocation(),
    dataRetentionDays(),
    includeAuditInBackup(),
  ]);
  return { export_formats, default_export_format, auto_backup_enabled, backup_schedule, backup_location, data_retention_days, include_audit_in_backup };
}

async function getIntegrationsSettings() {
  const [accounting_integration_enabled, accounting_api_url, accounting_api_key, credit_bureau_api_enabled, credit_bureau_api_key, credit_bureau_endpoint, webhooks_enabled, webhooks_array] = await Promise.all([
    accountingIntegrationEnabled(),
    accountingApiUrl(),
    accountingApiKey(),
    creditBureauApiEnabled(),
    creditBureauApiKey(),
    creditBureauEndpoint(),
    webhooksEnabled(),
    webhooks(),
  ]);
  return { accounting_integration_enabled, accounting_api_url, accounting_api_key, credit_bureau_api_enabled, credit_bureau_api_key, credit_bureau_endpoint, webhooks_enabled, webhooks: webhooks_array };
}

async function getAuditSecuritySettings() {
  const [audit_log_enabled, log_retention_days, log_events, force_https, session_encryption_enabled, gdpr_compliance_enabled, require_mfa_for_admin] = await Promise.all([
    auditLogEnabled(),
    logRetentionDays(),
    logEvents(),
    forceHttps(),
    sessionEncryptionEnabled(),
    gdprComplianceEnabled(),
    requireMfaForAdmin(),
  ]);
  return { audit_log_enabled, log_retention_days, log_events, force_https, session_encryption_enabled, gdpr_compliance_enabled, require_mfa_for_admin };
}


// ============================================================
// 🔄 SYNC SETTINGS (hybrid mode)
// ============================================================

/**
 * Get current sync mode (offline/online)
 * @returns {Promise<string>} "offline" | "online"
 */
async function syncMode() {
  return getValue("sync_mode", SettingType.GENERAL, "offline");
}

/**
 * Get server URL for online sync
 * @returns {Promise<string>}
 */
async function serverUrl() {
  return getValue("server_url", SettingType.GENERAL, "");
}

/**
 * Save sync mode and server URL (upsert)
 * @param {string} mode - 'offline' or 'online'
 * @param {string} [url] - server URL (required when mode === 'online')
 */
async function setSyncSettings(mode, url = "") {
  const { AppDataSource } = require("../main/db/data-source");
  const repository = AppDataSource.getRepository(SystemSetting);
  if (!repository) {
    throw new Error("SystemSetting repository not available");
  }

  // Save sync_mode
  const syncModeKey = "sync_mode";
  let syncModeRecord = await repository.findOne({
    where: { key: syncModeKey, setting_type: SettingType.GENERAL, is_deleted: false }
  });
  if (!syncModeRecord) {
    syncModeRecord = repository.create({
      key: syncModeKey,
      setting_type: SettingType.GENERAL,
      value: mode,
      description: "Offline/Online mode for hybrid sync",
      is_public: true
    });
  } else {
    syncModeRecord.value = mode;
  }
  await repository.save(syncModeRecord);

  // Save server_url (if mode === 'online' and url provided; otherwise clear it)
  const serverUrlKey = "server_url";
  let serverUrlRecord = await repository.findOne({
    where: { key: serverUrlKey, setting_type: SettingType.GENERAL, is_deleted: false }
  });
  if (mode === "online" && url) {
    if (!serverUrlRecord) {
      serverUrlRecord = repository.create({
        key: serverUrlKey,
        setting_type: SettingType.GENERAL,
        value: url,
        description: "Server URL for online sync",
        is_public: true
      });
    } else {
      serverUrlRecord.value = url;
    }
    await repository.save(serverUrlRecord);
  } else if (mode === "offline") {
    // Clear the stored server URL when switching offline
    if (serverUrlRecord) {
      serverUrlRecord.value = "";
      await repository.save(serverUrlRecord);
    }
  }
}



// ============================================================
// 📤 EXPORT ALL FUNCTIONS
// ============================================================

module.exports = {
  syncMode,
  serverUrl,
  setSyncSettings,


  // Core getters
  getValue,
  getBool,
  getInt,
  getArray,

  // General
  companyName,
  branchLocation,
  defaultTimezone,
  language,
  currency,
  receiptFooterMessage,
  autoLogoutMinutes,
  dateFormat,

  // Collections
  defaultInterestRate,
  defaultPenaltyRate,
  penaltyCalculationMethod,
  enableAutoPenalty,
  penaltyGraceDays,
  overdueReminderDays,
  maxLoanAmount,
  minLoanAmount,
  enforceCreditCheck,

  // Loans
  allowedLoanStatuses,
  enablePartialPayment,
  enableEarlyPaymentDiscount,
  earlyPaymentDiscountRate,
  requireLoanAgreement,
  loanAgreementTemplate,
  amortizationType,
  defaultLoanTermMonths,

  // Notifications
  emailEnabled,
  smsEnabled,
  smsProvider,
  reminderDaysBeforeDue,
  overdueNotificationFrequency,
  notifyOnPayment,
  notifyOnPenalty,
  smtpHost,
  smtpPort,
  smtpUsername,
  smtpPassword,
  smtpFromEmail,
  smtpFromName,
  getSmtpConfig,
  twilioAccountSid,
  twilioAuthToken,
  twilioPhoneNumber,
  twilioMessagingServiceSid,
  getTwilioConfig,

  // Reports
  exportFormats,
  defaultExportFormat,
  autoBackupEnabled,
  backupSchedule,
  backupLocation,
  dataRetentionDays,
  includeAuditInBackup,

  // Integrations
  accountingIntegrationEnabled,
  accountingApiUrl,
  accountingApiKey,
  creditBureauApiEnabled,
  creditBureauApiKey,
  creditBureauEndpoint,
  webhooksEnabled,
  webhooks,

  // Audit & Security
  auditLogEnabled,
  logRetentionDays,
  logEvents,
  forceHttps,
  sessionEncryptionEnabled,
  gdprComplianceEnabled,
  requireMfaForAdmin,

  // Category groups
  getGeneralSettings,
  getCollectionsSettings,
  getLoansSettings,
  getNotificationsSettings,
  getReportsSettings,
  getIntegrationsSettings,
  getAuditSecuritySettings,
};