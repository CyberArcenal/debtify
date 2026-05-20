// src/main/db/data-source.js
//@ts-check
const fs = require("fs");
const path = require("path");
const { DataSource } = require("typeorm");
const { getDatabaseConfig } = require("./database");

// Import existing entities
const LicenseCache = require("../../entities/LicenseCache");
const { SystemSetting } = require("../../entities/systemSettings");
const NotificationLog = require("../../entities/NotificationLog");
const Notification = require("../../entities/Notification");
const Borrower = require("../../entities/Borrower");
const Debt = require("../../entities/Debt");
const LoanAgreement = require("../../entities/LoanAgreement");
const PaymentTransaction = require("../../entities/PaymentTransaction");
const PenaltyTransaction = require("../../entities/PenaltyTransaction");
const { AuditLog } = require("../../entities/AuditLog");

// ========== NEW ENTITIES ==========
const DebtorGroup = require("../../entities/DebtorGroup");
const DebtorGroupMember = require("../../entities/DebtorGroupMember");
const LoanApplication = require("../../entities/LoanApplication");
const PaymentMethod = require("../../entities/PaymentMethod");
const PaymentMethodStat = require("../../entities/PaymentMethodStat");
const Printer = require("../../entities/Printer");
const CreditCheckLog = require("../../entities/CreditCheckLog");
const InterestRateChangeLog = require("../../entities/InterestRateChangeLog");

const config = getDatabaseConfig();

const entities = [
  AuditLog,
  Borrower,
  Debt,
  LoanAgreement,
  PaymentTransaction,
  PenaltyTransaction,
  LicenseCache,
  SystemSetting,
  InterestRateChangeLog,
  NotificationLog,
  Notification,
  DebtorGroup,
  DebtorGroupMember,
  LoanApplication,
  PaymentMethod,
  PaymentMethodStat,
  Printer,
  CreditCheckLog,
];

const dataSourceOptions = {
  ...config,
  entities,
  migrations: Array.isArray(config.migrations)
    ? config.migrations
    : [config.migrations],
};

// @ts-ignore
const AppDataSource = new DataSource(dataSourceOptions);

module.exports = { AppDataSource };