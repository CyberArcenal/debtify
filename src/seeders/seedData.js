// src/seeders/seedDebtManagerX.js
// DebtManagerX Database Seeder (Full version)
// Run with: npm run seed:debt -- [options]
// Or: node src/seeders/seedDebtManagerX.js

const { DataSource } = require("typeorm");
const path = require("path");

// Entity imports
const { AuditLog } = require("../entities/AuditLog");
const Borrower = require("../entities/Borrower");
const CreditCheckLog = require("../entities/CreditCheckLog");
const Debt = require("../entities/Debt");
const DebtorGroup = require("../entities/DebtorGroup");
const DebtorGroupMember = require("../entities/DebtorGroupMember");
const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
const LoanAgreement = require("../entities/LoanAgreement");
const LoanApplication = require("../entities/LoanApplication");
const Notification = require("../entities/Notification");
const NotificationLog = require("../entities/NotificationLog");
const PaymentMethod = require("../entities/PaymentMethod");
const PaymentMethodStat = require("../entities/PaymentMethodStat");
const PaymentTransaction = require("../entities/PaymentTransaction");
const PenaltyTransaction = require("../entities/PenaltyTransaction");
const Printer = require("../entities/Printer");

// ========== CONFIGURATION ==========
const DEFAULT_CONFIG = {
  borrowerCount: 25,
  debtCount: 60,
  paymentCount: 120,
  penaltyCount: 30,
  loanAgreementCount: 45,
  notificationCount: 80,
  notificationLogCount: 100,
  auditLogCount: 150,
  creditCheckCount: 40,
  groupCount: 8,
  groupMemberCount: 35,
  interestRateChangeCount: 25,
  loanApplicationCount: 30,
  paymentMethodCount: 6,
  printerCount: 3,
  clearOnly: false,
  skipBorrowers: false,
  skipDebts: false,
  skipPayments: false,
  skipPenalties: false,
  skipLoanAgreements: false,
  skipNotifications: false,
  skipNotificationLogs: false,
  skipAuditLogs: false,
  skipCreditChecks: false,
  skipGroups: false,
  skipGroupMembers: false,
  skipInterestRateChanges: false,
  skipLoanApplications: false,
  skipPaymentMethods: false,
  skipPrinters: false,
};

// ========== RANDOM HELPERS ==========
const random = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min, max, decimals = 2) =>
    +(Math.random() * (max - min) + min).toFixed(decimals),
  date: (start, end) =>
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  pastDate: () => random.date(new Date(2023, 0, 1), new Date()),
  futureDate: () => random.date(new Date(), new Date(2026, 11, 31)),
  element: (arr) => arr[Math.floor(Math.random() * arr.length)],
  boolean: (probability = 0.5) => Math.random() < probability,
  
  name: () => {
    const first = [
      "John", "Jane", "Michael", "Sarah", "David", "Maria", "James", "Patricia",
      "Robert", "Jennifer", "William", "Elizabeth", "Joseph", "Linda", "Thomas",
      "Susan", "Charles", "Jessica", "Christopher", "Karen", "Daniel", "Nancy",
      "Matthew", "Lisa", "Anthony", "Betty", "Mark", "Sandra", "Donald", "Ashley"
    ];
    const last = [
      "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
      "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
      "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
      "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
    ];
    return `${random.element(first)} ${random.element(last)}`;
  },
  
  email: (name) => {
    const cleanName = name.toLowerCase().replace(/\s/g, ".");
    return `${cleanName}${random.int(1, 99)}@example.com`;
  },
  
  phone: () => `+63${random.int(900000000, 999999999)}`,
  
  address: () => {
    const streets = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm Blvd"];
    return `${random.int(100, 9999)} ${random.element(streets)}, ${random.element(["Manila", "Cebu", "Davao", "Makati", "Quezon City"])}`;
  },
  
  status: () => random.element(["active", "paid", "overdue", "defaulted"]),
  
  paymentMethodName: () => random.element(["Cash", "Bank Transfer", "Check", "GCash", "PayMaya", "Credit Card"]),
  paymentMethodIcon: () => random.element(["DollarSign", "Landmark", "Receipt", "Smartphone", "CreditCard", "Wallet"]),
  
  printerInterface: () => random.element(["usb", "network", "bluetooth"]),
  printerConnection: (iface) => {
    if (iface === "usb") return `USB00${random.int(1, 9)}`;
    if (iface === "network") return `192.168.${random.int(1, 254)}.${random.int(1, 254)}:9100`;
    return `AA:BB:CC:${random.int(10, 99)}:${random.int(10, 99)}:${random.int(10, 99)}`;
  },
  
  riskLevel: () => random.element(["Low", "Medium", "High"]),
  
  creditScore: () => random.int(300, 850),
  
  interestRate: () => random.float(0, 15, 2),
  
  groupColor: () => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
    return random.element(colors);
  },
  
  loanPurpose: () => random.element([
    "Business Expansion", "Emergency Medical", "Education", "Home Renovation",
    "Debt Consolidation", "Vehicle Purchase", "Wedding Expenses", "Travel"
  ]),
  
  notificationType: () => random.element(["error", "info", "reminder", "overdue", "payment_confirmation"]),
  
  logStatus: () => random.element(["queued", "sent", "failed", "resend"]),
  
  auditAction: () => random.element(["CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN", "LOGOUT", "EXPORT"]),
  
  auditEntity: () => random.element([
    "Borrower", "Debt", "PaymentTransaction", "PenaltyTransaction", "LoanAgreement",
    "Notification", "CreditCheckLog", "DebtorGroup", "LoanApplication", "PaymentMethod", "Printer"
  ]),
};

// ========== SEEDER CLASS ==========
class DebtManagerXSeeder {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dataSource = null;
    this.queryRunner = null;
    this.borrowers = [];
    this.debts = [];
    this.groups = [];
    this.paymentMethods = [];
  }

  async init() {
    console.log("⏳ Initializing database connection...");
    const { AppDataSource } = require("../main/db/data-source");
    this.dataSource = await AppDataSource.initialize();
    this.queryRunner = this.dataSource.createQueryRunner();
    console.log("✅ Database connected");
  }

  async destroy() {
    if (this.queryRunner) await this.queryRunner.release();
    if (this.dataSource) await this.dataSource.destroy();
    console.log("🔒 Connection closed");
  }

  async clearData() {
    console.log("🧹 Clearing all debt management data...");
    await this.queryRunner.query("PRAGMA foreign_keys = OFF;");
    try {
      const tables = [
        "debtor_group_members",
        "debtor_groups",
        "credit_check_logs",
        "loan_applications",
        "interest_rate_change_logs",
        "payment_method_stats",
        "payment_methods",
        "printers",
        "audit_logs",
        "notification_logs",
        "notifications",
        "penalty_transactions",
        "payment_transactions",
        "loan_agreements",
        "debts",
        "borrowers",
      ];
      for (const table of tables) {
        await this.queryRunner.query(`DELETE FROM ${table};`);
        await this.queryRunner.query(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
      }
    } catch (error) {
      console.warn("Some tables may not exist yet:", error.message);
    } finally {
      await this.queryRunner.query("PRAGMA foreign_keys = ON;");
    }
    console.log("✅ All tables cleared");
  }

  // ------------------------------------------------------------
  // SEED METHODS
  // ------------------------------------------------------------
  async seedBorrowers() {
    console.log(`👥 Seeding ${this.config.borrowerCount} borrowers...`);
    const borrowers = [];
    for (let i = 0; i < this.config.borrowerCount; i++) {
      const name = random.name();
      borrowers.push({
        name: name,
        contact: random.boolean(0.9) ? random.phone() : null,
        email: random.email(name),
        address: random.boolean(0.7) ? random.address() : null,
        notes: random.boolean(0.3) ? `Initial contact via ${random.element(["phone", "email", "referral"])}` : null,
        deletedAt: random.boolean(0.05) ? random.pastDate() : null,
      });
    }
    const repo = this.dataSource.getRepository(Borrower);
    const saved = await repo.save(borrowers);
    console.log(`✅ ${saved.length} borrowers saved`);
    return saved;
  }

  async seedDebts(borrowers) {
    console.log(`💰 Seeding ${this.config.debtCount} debts...`);
    const debts = [];
    const statuses = ["active", "paid", "overdue", "defaulted"];
    
    for (let i = 0; i < this.config.debtCount; i++) {
      const borrower = random.element(borrowers);
      const totalAmount = random.float(1000, 500000);
      let paidAmount = random.float(0, totalAmount);
      const remainingAmount = totalAmount - paidAmount;
      
      const dueDate = random.futureDate();
      let status = random.element(statuses);
      
      if (remainingAmount <= 0.01) {
        status = "paid";
        paidAmount = totalAmount;
      } else if (status === "paid" && remainingAmount > 0.01) {
        status = "active";
      }
      
      debts.push({
        name: `${borrower.name} - ${random.element(["Personal Loan", "Business Loan", "Emergency Fund", "Education Loan", "Medical Bill"])}`,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        dueDate: dueDate,
        status: status,
        interestRate: random.boolean(0.8) ? random.float(0, 15) : null,
        penaltyRate: random.boolean(0.6) ? random.float(1, 5) : null,
        borrower: { id: borrower.id },
      });
    }
    
    const repo = this.dataSource.getRepository(Debt);
    const saved = await repo.save(debts);
    console.log(`✅ ${saved.length} debts saved`);
    return saved;
  }

  async seedPayments(debts) {
    console.log(`💵 Seeding ${this.config.paymentCount} payment transactions...`);
    const payments = [];
    const repo = this.dataSource.getRepository(PaymentTransaction);
    
    const debtPaidSoFar = new Map();
    debts.forEach(debt => {
      debtPaidSoFar.set(debt.id, parseFloat(debt.paidAmount) || 0);
    });
    
    for (const debt of debts) {
      let remainingToPay = parseFloat(debt.paidAmount) || 0;
      let paymentCount = random.int(1, Math.min(5, remainingToPay > 0 ? 3 : 1));
      
      if (remainingToPay === 0) paymentCount = 0;
      
      for (let i = 0; i < paymentCount && remainingToPay > 0.01; i++) {
        let amount;
        if (i === paymentCount - 1) {
          amount = remainingToPay;
        } else {
          amount = random.float(100, remainingToPay * 0.7);
          if (amount > remainingToPay) amount = remainingToPay;
        }
        remainingToPay -= amount;
        
        payments.push({
          amount: amount,
          paymentDate: random.date(new Date(debt.createdAt || new Date(2023, 0, 1)), new Date()),
          reference: `PAY-${random.int(10000, 99999)}`,
          notes: random.boolean(0.3) ? random.element(["Partial payment", "Full settlement", "Advance payment", "Online transfer"]) : null,
          deletedAt: null,
          debt: { id: debt.id },
        });
      }
    }
    
    const extraPaymentsNeeded = this.config.paymentCount - payments.length;
    for (let i = 0; i < extraPaymentsNeeded; i++) {
      const debt = random.element(debts);
      const currentPaid = debtPaidSoFar.get(debt.id) || 0;
      const totalAmount = parseFloat(debt.totalAmount);
      const maxAdditional = totalAmount - currentPaid;
      
      if (maxAdditional > 10) {
        const amount = random.float(50, Math.min(maxAdditional, 50000));
        payments.push({
          amount: amount,
          paymentDate: random.pastDate(),
          reference: `PAY-${random.int(10000, 99999)}`,
          notes: random.boolean(0.3) ? "Additional payment" : null,
          deletedAt: null,
          debt: { id: debt.id },
        });
        debtPaidSoFar.set(debt.id, currentPaid + amount);
        
        await repo.manager
          .createQueryBuilder()
          .update(Debt)
          .set({ 
            paidAmount: currentPaid + amount,
            remainingAmount: totalAmount - (currentPaid + amount)
          })
          .where("id = :id", { id: debt.id })
          .execute();
      }
    }
    
    const saved = await repo.save(payments);
    console.log(`✅ ${saved.length} payment transactions saved`);
    return saved;
  }

  async seedPenalties(debts) {
    console.log(`⚠️ Seeding ${this.config.penaltyCount} penalty transactions...`);
    const penalties = [];
    const repo = this.dataSource.getRepository(PenaltyTransaction);
    
    const reasons = [
      "Late payment", "Missed payment deadline", "Overdue interest", 
      "Administrative fee", "Collection fee", "Legal notice fee"
    ];
    
    for (let i = 0; i < this.config.penaltyCount; i++) {
      const debt = random.element(debts);
      const amount = random.float(100, Math.max(500, parseFloat(debt.totalAmount) * 0.05));
      
      penalties.push({
        amount: amount,
        penaltyDate: random.date(new Date(debt.createdAt || new Date(2023, 0, 1)), new Date()),
        reason: random.element(reasons),
        debt: { id: debt.id },
      });
    }
    
    const saved = await repo.save(penalties);
    console.log(`✅ ${saved.length} penalty transactions saved`);
    return saved;
  }

  async seedLoanAgreements(debts) {
    console.log(`📄 Seeding ${this.config.loanAgreementCount} loan agreements...`);
    const agreements = [];
    const repo = this.dataSource.getRepository(LoanAgreement);
    
    for (let i = 0; i < this.config.loanAgreementCount && i < debts.length; i++) {
      const debt = debts[i % debts.length];
      agreements.push({
        agreementDate: random.date(new Date(debt.createdAt || new Date(2023, 0, 1)), debt.dueDate),
        lenderName: random.element([
          "ABC Lending Corp", "FastCash Loans", "MoneyTree Finance", 
          "SecureLoan Inc", "Capital One Bank", "MetroBank", 
          "UnionBank", "BPI Family Savings"
        ]),
        termsText: `This loan agreement is for ${debt.name}. Interest rate: ${debt.interestRate || 0}% per annum. Due date: ${debt.dueDate.toLocaleDateString()}.`,
        filePath: random.boolean(0.7) ? `/documents/agreement_${debt.id}.pdf` : null,
        deletedAt: random.boolean(0.05) ? random.pastDate() : null,
        debt: { id: debt.id },
      });
    }
    
    const saved = await repo.save(agreements);
    console.log(`✅ ${saved.length} loan agreements saved`);
    return saved;
  }

  async seedNotifications(debts) {
    console.log(`🔔 Seeding ${this.config.notificationCount} notifications...`);
    const notifications = [];
    const repo = this.dataSource.getRepository(Notification);
    
    const titles = {
      reminder: ["Payment Reminder", "Upcoming Due Date", "Friendly Reminder"],
      overdue: ["Overdue Payment Alert", "Payment Past Due", "Urgent: Payment Overdue"],
      payment_confirmation: ["Payment Received", "Payment Confirmation", "Thank You for Your Payment"],
      info: ["Account Update", "Interest Rate Change", "Statement Available"],
      error: ["Payment Failed", "Processing Error", "Action Required"]
    };
    
    for (let i = 0; i < this.config.notificationCount; i++) {
      const debt = random.element(debts);
      const type = random.notificationType();
      const title = random.element(titles[type] || titles.info);
      let message = "";
      
      switch (type) {
        case "reminder":
          message = `Your payment of ${random.float(500, 5000)} is due on ${debt.dueDate.toLocaleDateString()}. Remaining balance: ${debt.remainingAmount}`;
          break;
        case "overdue":
          message = `Your payment is now overdue. Please settle ${debt.remainingAmount} immediately to avoid additional penalties.`;
          break;
        case "payment_confirmation":
          message = `We have received your payment of ${random.float(500, 10000)}. Thank you!`;
          break;
        default:
          message = `This is a ${type} notification regarding your loan ${debt.name}.`;
      }
      
      notifications.push({
        title: title,
        message: message,
        type: type,
        isRead: random.boolean(0.3),
        scheduledFor: random.boolean(0.4) ? random.futureDate() : null,
        deletedAt: random.boolean(0.05) ? random.pastDate() : null,
        debt: { id: debt.id },
      });
    }
    
    const saved = await repo.save(notifications);
    console.log(`✅ ${saved.length} notifications saved`);
    return saved;
  }

  async seedNotificationLogs(borrowers) {
    console.log(`📧 Seeding ${this.config.notificationLogCount} notification logs...`);
    const logs = [];
    const repo = this.dataSource.getRepository(NotificationLog);
    
    for (let i = 0; i < this.config.notificationLogCount; i++) {
      const borrower = random.element(borrowers);
      const status = random.logStatus();
      const sentAt = status === "sent" ? random.pastDate() : null;
      const lastErrorAt = status === "failed" ? random.pastDate() : null;
      
      logs.push({
        recipient_email: borrower.email,
        subject: random.element(["Payment Reminder", "Loan Statement", "Overdue Notice", "Payment Confirmation"]),
        payload: JSON.stringify({
          borrowerId: borrower.id,
          templateId: random.int(1, 5),
          metadata: { source: "automated" }
        }),
        status: status,
        error_message: status === "failed" ? random.element(["SMTP timeout", "Invalid email", "Rate limit exceeded"]) : null,
        retry_count: status === "failed" ? random.int(1, 3) : 0,
        resend_count: status === "resend" ? random.int(1, 2) : 0,
        sent_at: sentAt,
        last_error_at: lastErrorAt,
      });
    }
    
    const saved = await repo.save(logs);
    console.log(`✅ ${saved.length} notification logs saved`);
    return saved;
  }

  async seedAuditLogs(borrowers, debts) {
    console.log(`📝 Seeding ${this.config.auditLogCount} audit logs...`);
    const logs = [];
    const repo = this.dataSource.getRepository(AuditLog);
    const users = ["admin", "loan_officer", "collector", "manager", "system"];
    
    for (let i = 0; i < this.config.auditLogCount; i++) {
      const action = random.auditAction();
      const entity = random.auditEntity();
      let entityId = null;
      
      if (entity === "Borrower" && borrowers.length) {
        entityId = random.element(borrowers).id;
      } else if ((entity === "Debt" || entity === "PaymentTransaction" || entity === "PenaltyTransaction") && debts.length) {
        entityId = random.element(debts).id;
      } else {
        entityId = random.int(1, 500);
      }
      
      logs.push({
        action: action,
        entity: entity,
        entityId: entityId,
        oldData: random.boolean(0.2) ? { previousValue: `old_${random.int(100, 999)}` } : null,
        newData: random.boolean(0.3) ? { newValue: `new_${random.int(100, 999)}` } : null,
        timestamp: random.pastDate(),
        user: random.element(users),
      });
    }
    
    const saved = await repo.save(logs);
    console.log(`✅ ${saved.length} audit logs saved`);
    return saved;
  }

  // NEW SEED METHODS
  async seedCreditCheckLogs(borrowers) {
    console.log(`📊 Seeding ${this.config.creditCheckCount} credit check logs...`);
    const logs = [];
    const repo = this.dataSource.getRepository(CreditCheckLog);
    for (let i = 0; i < this.config.creditCheckCount; i++) {
      const borrower = random.element(borrowers);
      const score = random.creditScore();
      const riskLevel = random.riskLevel();
      logs.push({
        debtorId: borrower.id,
        score: score,
        riskLevel: riskLevel,
        remarks: `Credit check performed on ${new Date().toLocaleDateString()}. Score: ${score}`,
        dateChecked: random.pastDate(),
      });
    }
    const saved = await repo.save(logs);
    console.log(`✅ ${saved.length} credit check logs saved`);
    return saved;
  }

  async seedGroups() {
    console.log(`👥 Seeding ${this.config.groupCount} debtor groups...`);
    const groups = [];
    const repo = this.dataSource.getRepository(DebtorGroup);
    const groupNames = ["VIP", "High-Risk", "Regular", "New", "Delinquent", "Good Standing", "Review", "Archived"];
    for (let i = 0; i < this.config.groupCount && i < groupNames.length; i++) {
      groups.push({
        name: groupNames[i],
        description: `Group for ${groupNames[i]} debtors`,
        color: random.groupColor(),
      });
    }
    const saved = await repo.save(groups);
    console.log(`✅ ${saved.length} debtor groups saved`);
    return saved;
  }

  async seedGroupMembers(groups, borrowers) {
    console.log(`👥 Seeding ${this.config.groupMemberCount} debtor group members...`);
    const members = [];
    const repo = this.dataSource.getRepository(DebtorGroupMember);
    const usedPairs = new Set();
    for (let i = 0; i < this.config.groupMemberCount; i++) {
      const group = random.element(groups);
      const debtor = random.element(borrowers);
      const key = `${group.id}-${debtor.id}`;
      if (usedPairs.has(key)) continue;
      usedPairs.add(key);
      members.push({
        groupId: group.id,
        debtorId: debtor.id,
        assignedAt: random.pastDate(),
      });
    }
    const saved = await repo.save(members);
    console.log(`✅ ${saved.length} group members saved`);
    return saved;
  }

  async seedInterestRateChangeLogs(debts) {
    console.log(`📈 Seeding ${this.config.interestRateChangeCount} interest rate change logs...`);
    const logs = [];
    const repo = this.dataSource.getRepository(InterestRateChangeLog);
    const users = ["admin", "system", "loan_officer"];
    for (let i = 0; i < this.config.interestRateChangeCount; i++) {
      const isGlobal = random.boolean(0.4);
      const settingKey = isGlobal ? "default_interest_rate" : `loan_${random.element(debts).id}`;
      const oldVal = random.float(0, 20);
      const newVal = random.float(0, 20);
      logs.push({
        setting_key: settingKey,
        old_value: oldVal,
        new_value: newVal,
        changed_by: random.element(users),
        reason: random.boolean(0.5) ? "Market adjustment" : "Client negotiation",
        loan_id: isGlobal ? null : random.element(debts).id,
        changed_at: random.pastDate(),
      });
    }
    const saved = await repo.save(logs);
    console.log(`✅ ${saved.length} interest rate change logs saved`);
    return saved;
  }

  async seedLoanApplications(borrowers) {
    console.log(`📋 Seeding ${this.config.loanApplicationCount} loan applications...`);
    const apps = [];
    const repo = this.dataSource.getRepository(LoanApplication);
    const statuses = ["pending", "approved", "rejected"];
    for (let i = 0; i < this.config.loanApplicationCount; i++) {
      const borrower = random.element(borrowers);
      const status = random.element(statuses);
      const requestedAmount = random.float(1000, 200000);
      const proposedDueDate = random.futureDate();
      const createdAt = random.pastDate();
      apps.push({
        debtorId: borrower.id,
        debtorName: borrower.name,
        debtorContact: borrower.contact,
        debtorEmail: borrower.email,
        debtorAddress: borrower.address,
        requestedAmount: requestedAmount,
        purpose: random.loanPurpose(),
        proposedDueDate: proposedDueDate,
        interestRate: random.float(0, 15),
        status: status,
        approvedAt: status === "approved" ? random.date(createdAt, new Date()) : null,
        rejectedAt: status === "rejected" ? random.date(createdAt, new Date()) : null,
        approvedBy: status === "approved" ? random.element(["admin", "loan_officer"]) : null,
        rejectionReason: status === "rejected" ? random.element(["Low credit score", "Insufficient income", "Incomplete documents"]) : null,
        createdAt: createdAt,
        updatedAt: random.date(createdAt, new Date()),
      });
    }
    const saved = await repo.save(apps);
    console.log(`✅ ${saved.length} loan applications saved`);
    return saved;
  }

  async seedPaymentMethods() {
    console.log(`💳 Seeding ${this.config.paymentMethodCount} payment methods...`);
    const methods = [];
    const repo = this.dataSource.getRepository(PaymentMethod);
    const methodNames = ["Cash", "Bank Transfer", "Check", "GCash", "PayMaya", "Credit Card"];
    const icons = ["DollarSign", "Landmark", "Receipt", "Smartphone", "CreditCard", "Wallet"];
    for (let i = 0; i < this.config.paymentMethodCount && i < methodNames.length; i++) {
      methods.push({
        name: methodNames[i],
        description: `Payment via ${methodNames[i]}`,
        icon: icons[i],
        isDefault: i === 0, // first is default
      });
    }
    const saved = await repo.save(methods);
    // Create associated stats (required by PaymentMethodStat entity)
    const statRepo = this.dataSource.getRepository(PaymentMethodStat);
    for (const method of saved) {
      const stat = statRepo.create({
        method: method,
        transactionCount: 0,
        totalAmount: 0,
      });
      await statRepo.save(stat);
    }
    console.log(`✅ ${saved.length} payment methods saved with stats`);
    return saved;
  }

  async seedPrinters() {
    console.log(`🖨️ Seeding ${this.config.printerCount} printers...`);
    const printers = [];
    const repo = this.dataSource.getRepository(Printer);
    const interfaces = ["usb", "network", "bluetooth"];
    for (let i = 0; i < this.config.printerCount; i++) {
      const iface = random.printerInterface();
      printers.push({
        name: `Printer ${i+1}`,
        description: `Test printer ${i+1}`,
        interface: iface,
        connectionString: random.printerConnection(iface),
        isDefault: i === 0,
        status: random.element(["online", "offline", "error"]),
        lastTested: random.boolean(0.5) ? random.pastDate() : null,
      });
    }
    const saved = await repo.save(printers);
    console.log(`✅ ${saved.length} printers saved`);
    return saved;
  }

  async run() {
    try {
      await this.init();
      await this.queryRunner.startTransaction();

      if (this.config.clearOnly) {
        await this.clearData();
        console.log("🧹 Clear only mode – no seeding performed.");
        await this.queryRunner.commitTransaction();
        return;
      }

      await this.clearData();

      // Borrowers (base)
      if (!this.config.skipBorrowers) {
        this.borrowers = await this.seedBorrowers();
      } else {
        this.borrowers = await this.dataSource.getRepository(Borrower).find();
      }

      // Debts (depends on borrowers)
      if (!this.config.skipDebts && this.borrowers.length) {
        this.debts = await this.seedDebts(this.borrowers);
      } else {
        this.debts = await this.dataSource.getRepository(Debt).find();
      }

      // Payments, penalties, agreements, notifications (depend on debts)
      if (!this.config.skipPayments && this.debts.length) await this.seedPayments(this.debts);
      if (!this.config.skipPenalties && this.debts.length) await this.seedPenalties(this.debts);
      if (!this.config.skipLoanAgreements && this.debts.length) await this.seedLoanAgreements(this.debts);
      if (!this.config.skipNotifications && this.debts.length) await this.seedNotifications(this.debts);

      // NotificationLogs (depends on borrowers)
      if (!this.config.skipNotificationLogs && this.borrowers.length) await this.seedNotificationLogs(this.borrowers);

      // AuditLogs (depends on borrowers + debts)
      if (!this.config.skipAuditLogs) await this.seedAuditLogs(this.borrowers, this.debts);

      // NEW ENTITIES
      if (!this.config.skipCreditChecks && this.borrowers.length) await this.seedCreditCheckLogs(this.borrowers);
      
      if (!this.config.skipGroups) {
        this.groups = await this.seedGroups();
      } else {
        this.groups = await this.dataSource.getRepository(DebtorGroup).find();
      }
      
      if (!this.config.skipGroupMembers && this.groups.length && this.borrowers.length) {
        await this.seedGroupMembers(this.groups, this.borrowers);
      }
      
      if (!this.config.skipInterestRateChanges && this.debts.length) await this.seedInterestRateChangeLogs(this.debts);
      
      if (!this.config.skipLoanApplications && this.borrowers.length) await this.seedLoanApplications(this.borrowers);
      
      if (!this.config.skipPaymentMethods) {
        this.paymentMethods = await this.seedPaymentMethods();
      }
      
      if (!this.config.skipPrinters) await this.seedPrinters();

      await this.queryRunner.commitTransaction();

      console.log("\n🎉 DEBTMANAGERX SEED COMPLETED SUCCESSFULLY!");
      console.log(`   Borrowers: ${this.config.borrowerCount}`);
      console.log(`   Debts: ${this.config.debtCount}`);
      console.log(`   Payments: ${this.config.paymentCount}`);
      console.log(`   Penalties: ${this.config.penaltyCount}`);
      console.log(`   Loan Agreements: ${this.config.loanAgreementCount}`);
      console.log(`   Notifications: ${this.config.notificationCount}`);
      console.log(`   Notification Logs: ${this.config.notificationLogCount}`);
      console.log(`   Audit Logs: ${this.config.auditLogCount}`);
      console.log(`   Credit Check Logs: ${this.config.creditCheckCount}`);
      console.log(`   Debtor Groups: ${this.config.groupCount}`);
      console.log(`   Group Members: ${this.config.groupMemberCount}`);
      console.log(`   Interest Rate Change Logs: ${this.config.interestRateChangeCount}`);
      console.log(`   Loan Applications: ${this.config.loanApplicationCount}`);
      console.log(`   Payment Methods: ${this.config.paymentMethodCount}`);
      console.log(`   Printers: ${this.config.printerCount}`);
    } catch (error) {
      console.error("\n❌ Seeding failed – rolling back...", error);
      if (this.queryRunner) await this.queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.destroy();
    }
  }
}

// ========== COMMAND LINE HANDLER ==========
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--clear-only":
        config.clearOnly = true;
        break;
      case "--borrowers":
        config.borrowerCount = parseInt(args[++i]) || DEFAULT_CONFIG.borrowerCount;
        config.skipBorrowers = false;
        break;
      case "--debts":
        config.debtCount = parseInt(args[++i]) || DEFAULT_CONFIG.debtCount;
        config.skipDebts = false;
        break;
      case "--payments":
        config.paymentCount = parseInt(args[++i]) || DEFAULT_CONFIG.paymentCount;
        config.skipPayments = false;
        break;
      case "--penalties":
        config.penaltyCount = parseInt(args[++i]) || DEFAULT_CONFIG.penaltyCount;
        config.skipPenalties = false;
        break;
      case "--agreements":
        config.loanAgreementCount = parseInt(args[++i]) || DEFAULT_CONFIG.loanAgreementCount;
        config.skipLoanAgreements = false;
        break;
      case "--notifications":
        config.notificationCount = parseInt(args[++i]) || DEFAULT_CONFIG.notificationCount;
        config.skipNotifications = false;
        break;
      case "--logs":
        config.notificationLogCount = parseInt(args[++i]) || DEFAULT_CONFIG.notificationLogCount;
        config.skipNotificationLogs = false;
        break;
      case "--audit":
        config.auditLogCount = parseInt(args[++i]) || DEFAULT_CONFIG.auditLogCount;
        config.skipAuditLogs = false;
        break;
      case "--credit-checks":
        config.creditCheckCount = parseInt(args[++i]) || DEFAULT_CONFIG.creditCheckCount;
        config.skipCreditChecks = false;
        break;
      case "--groups":
        config.groupCount = parseInt(args[++i]) || DEFAULT_CONFIG.groupCount;
        config.skipGroups = false;
        break;
      case "--group-members":
        config.groupMemberCount = parseInt(args[++i]) || DEFAULT_CONFIG.groupMemberCount;
        config.skipGroupMembers = false;
        break;
      case "--interest-changes":
        config.interestRateChangeCount = parseInt(args[++i]) || DEFAULT_CONFIG.interestRateChangeCount;
        config.skipInterestRateChanges = false;
        break;
      case "--loan-apps":
        config.loanApplicationCount = parseInt(args[++i]) || DEFAULT_CONFIG.loanApplicationCount;
        config.skipLoanApplications = false;
        break;
      case "--payment-methods":
        config.paymentMethodCount = parseInt(args[++i]) || DEFAULT_CONFIG.paymentMethodCount;
        config.skipPaymentMethods = false;
        break;
      case "--printers":
        config.printerCount = parseInt(args[++i]) || DEFAULT_CONFIG.printerCount;
        config.skipPrinters = false;
        break;
      case "--skip-borrowers":
        config.skipBorrowers = true;
        break;
      case "--skip-debts":
        config.skipDebts = true;
        break;
      case "--skip-payments":
        config.skipPayments = true;
        break;
      case "--skip-penalties":
        config.skipPenalties = true;
        break;
      case "--skip-agreements":
        config.skipLoanAgreements = true;
        break;
      case "--skip-notifications":
        config.skipNotifications = true;
        break;
      case "--skip-logs":
        config.skipNotificationLogs = true;
        break;
      case "--skip-audit":
        config.skipAuditLogs = true;
        break;
      case "--skip-credit-checks":
        config.skipCreditChecks = true;
        break;
      case "--skip-groups":
        config.skipGroups = true;
        break;
      case "--skip-group-members":
        config.skipGroupMembers = true;
        break;
      case "--skip-interest-changes":
        config.skipInterestRateChanges = true;
        break;
      case "--skip-loan-apps":
        config.skipLoanApplications = true;
        break;
      case "--skip-payment-methods":
        config.skipPaymentMethods = true;
        break;
      case "--skip-printers":
        config.skipPrinters = true;
        break;
      case "--help":
        console.log(`
DebtManagerX Database Seeder (Full)

Usage: node src/seeders/seedDebtManagerX.js [options]

Options:
  --clear-only              Clear all data without seeding
  --borrowers <n>           Number of borrowers (default: 25)
  --debts <n>               Number of debts (default: 60)
  --payments <n>            Number of payment transactions (default: 120)
  --penalties <n>           Number of penalty transactions (default: 30)
  --agreements <n>          Number of loan agreements (default: 45)
  --notifications <n>       Number of notifications (default: 80)
  --logs <n>                Number of notification logs (default: 100)
  --audit <n>               Number of audit logs (default: 150)
  --credit-checks <n>       Number of credit check logs (default: 40)
  --groups <n>              Number of debtor groups (default: 8)
  --group-members <n>       Number of group members (default: 35)
  --interest-changes <n>    Interest rate change logs (default: 25)
  --loan-apps <n>           Loan applications (default: 30)
  --payment-methods <n>     Payment methods (default: 6)
  --printers <n>            Printers (default: 3)

Skip options:
  --skip-borrowers, --skip-debts, --skip-payments, --skip-penalties,
  --skip-agreements, --skip-notifications, --skip-logs, --skip-audit,
  --skip-credit-checks, --skip-groups, --skip-group-members,
  --skip-interest-changes, --skip-loan-apps, --skip-payment-methods,
  --skip-printers

Examples:
  node src/seeders/seedDebtManagerX.js --borrowers 50 --debts 100
  node src/seeders/seedDebtManagerX.js --clear-only
`);
        process.exit(0);
    }
  }
  return config;
}

if (require.main === module) {
  const config = parseArgs();
  const seeder = new DebtManagerXSeeder(config);
  seeder.run().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

module.exports = { DebtManagerXSeeder, DEFAULT_CONFIG };