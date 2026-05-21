/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1779354064144 {
    name = 'InitSchema1779354064144'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "action" varchar NOT NULL, "entity" varchar NOT NULL, "entityId" integer, "oldData" json, "newData" json, "timestamp" datetime NOT NULL DEFAULT (datetime('now')), "user" varchar)`);
        await queryRunner.query(`CREATE TABLE "borrowers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "contact" varchar, "email" varchar, "address" varchar, "notes" text, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "borrowerId" integer)`);
        await queryRunner.query(`CREATE TABLE "loan_agreements" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "agreementDate" datetime, "lenderName" varchar, "termsText" text, "filePath" varchar, "deletedAt" datetime, "debtId" integer)`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "methodId" integer, "amount" decimal(12,2) NOT NULL, "paymentDate" datetime NOT NULL, "reference" varchar, "notes" varchar, "deletedAt" datetime, "recordedAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer)`);
        await queryRunner.query(`CREATE TABLE "penalty_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "amount" decimal(12,2) NOT NULL, "penaltyDate" datetime NOT NULL, "reason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer)`);
        await queryRunner.query(`CREATE TABLE "license_cache" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "license_key" text, "license_type" text NOT NULL, "status" text NOT NULL, "expires_at" datetime, "activated_at" datetime, "days_remaining" integer, "features" text DEFAULT ('[]'), "limits" text DEFAULT ('{}'), "usage" text DEFAULT ('{}'), "max_devices" integer NOT NULL DEFAULT (1), "current_devices" integer NOT NULL DEFAULT (0), "last_sync" datetime, "next_sync_due" datetime, "sync_interval_days" integer NOT NULL DEFAULT (30), "device_id" text, "activated_on_device" datetime, "server_response" text, "activation_id" text, "grace_period_days" integer NOT NULL DEFAULT (7), "server_timestamp" datetime, "offline_activation" boolean NOT NULL DEFAULT (0), "trial_consumed" boolean NOT NULL DEFAULT (0), "last_deactivated" datetime, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "UQ_e5240a5d083ab00fd7210838f5d" UNIQUE ("license_key"))`);
        await queryRunner.query(`CREATE INDEX "idx_license_key" ON "license_cache" ("license_key") `);
        await queryRunner.query(`CREATE INDEX "idx_expires_at" ON "license_cache" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_next_sync" ON "license_cache" ("next_sync_due") `);
        await queryRunner.query(`CREATE INDEX "idx_license_status_expires" ON "license_cache" ("status", "expires_at") `);
        await queryRunner.query(`CREATE TABLE "system_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar(100) NOT NULL, "value" text NOT NULL, "setting_type" varchar CHECK( "setting_type" IN ('general','collections','loans','notifications','reports','integrations','audit_security') ) NOT NULL, "description" text, "is_public" boolean NOT NULL DEFAULT (0), "is_deleted" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_system_settings_type_key" ON "system_settings" ("setting_type", "key") `);
        await queryRunner.query(`CREATE TABLE "interest_rate_change_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "setting_key" varchar NOT NULL, "old_value" decimal(5,2), "new_value" decimal(5,2), "changed_by" varchar NOT NULL DEFAULT ('system'), "reason" text, "changed_at" datetime NOT NULL DEFAULT (datetime('now')), "loan_id" integer)`);
        await queryRunner.query(`CREATE INDEX "idx_ir_log_key" ON "interest_rate_change_logs" ("setting_key") `);
        await queryRunner.query(`CREATE INDEX "idx_ir_log_changed_by" ON "interest_rate_change_logs" ("changed_by") `);
        await queryRunner.query(`CREATE INDEX "idx_ir_log_changed_at" ON "interest_rate_change_logs" ("changed_at") `);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "recipient_email" varchar NOT NULL, "subject" varchar, "payload" text, "status" varchar(20) NOT NULL DEFAULT ('queued'), "error_message" text, "retry_count" integer NOT NULL DEFAULT (0), "resend_count" integer NOT NULL DEFAULT (0), "sent_at" datetime, "last_error_at" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_status" ON "notification_logs" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_notification_recipient" ON "notification_logs" ("recipient_email") `);
        await queryRunner.query(`CREATE INDEX "IDX_notification_status_created" ON "notification_logs" ("status", "created_at") `);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('error','info','reminder','overdue','payment_confirmation') ) NOT NULL DEFAULT ('reminder'), "isRead" boolean NOT NULL DEFAULT (0), "scheduledFor" datetime, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer)`);
        await queryRunner.query(`CREATE TABLE "debtor_groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "color" varchar NOT NULL DEFAULT ('#3b82f6'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "debtor_group_members" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "groupId" integer NOT NULL, "debtorId" integer NOT NULL, "assignedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_6f27c445ddd04575a2639e7a955" UNIQUE ("groupId", "debtorId"))`);
        await queryRunner.query(`CREATE TABLE "loan_applications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer, "debtorName" varchar NOT NULL, "debtorContact" varchar, "debtorEmail" varchar, "debtorAddress" varchar, "requestedAmount" decimal(12,2) NOT NULL, "purpose" varchar NOT NULL, "proposedDueDate" datetime NOT NULL, "interestRate" decimal(5,2), "status" varchar CHECK( "status" IN ('pending','approved','rejected') ) NOT NULL DEFAULT ('pending'), "approvedAt" datetime, "rejectedAt" datetime, "approvedBy" varchar, "rejectionReason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "icon" varchar NOT NULL DEFAULT ('CreditCard'), "isDefault" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "payment_method_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "transactionCount" integer NOT NULL DEFAULT (0), "totalAmount" decimal(12,2) NOT NULL DEFAULT (0), "methodId" integer, CONSTRAINT "REL_cbca66b221854a9be2bf81d324" UNIQUE ("methodId"))`);
        await queryRunner.query(`CREATE TABLE "printers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "interface" varchar CHECK( "interface" IN ('usb','network','bluetooth') ) NOT NULL, "connectionString" varchar NOT NULL, "isDefault" boolean NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('online','offline','error') ) NOT NULL DEFAULT ('offline'), "lastTested" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "credit_check_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer NOT NULL, "score" integer NOT NULL DEFAULT (0), "riskLevel" varchar CHECK( "riskLevel" IN ('Low','Medium','High') ) NOT NULL, "remarks" varchar, "dateChecked" datetime NOT NULL DEFAULT (datetime('now')), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "borrowerId" integer, CONSTRAINT "FK_04526b5d254ef76c4edb348d33b" FOREIGN KEY ("borrowerId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_debts"("id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "borrowerId") SELECT "id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "borrowerId" FROM "debts"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`ALTER TABLE "temporary_debts" RENAME TO "debts"`);
        await queryRunner.query(`CREATE TABLE "temporary_loan_agreements" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "agreementDate" datetime, "lenderName" varchar, "termsText" text, "filePath" varchar, "deletedAt" datetime, "debtId" integer, CONSTRAINT "FK_9d82e145d186b22bdd197a139bc" FOREIGN KEY ("debtId") REFERENCES "debts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_loan_agreements"("id", "agreementDate", "lenderName", "termsText", "filePath", "deletedAt", "debtId") SELECT "id", "agreementDate", "lenderName", "termsText", "filePath", "deletedAt", "debtId" FROM "loan_agreements"`);
        await queryRunner.query(`DROP TABLE "loan_agreements"`);
        await queryRunner.query(`ALTER TABLE "temporary_loan_agreements" RENAME TO "loan_agreements"`);
        await queryRunner.query(`CREATE TABLE "temporary_payment_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "methodId" integer, "amount" decimal(12,2) NOT NULL, "paymentDate" datetime NOT NULL, "reference" varchar, "notes" varchar, "deletedAt" datetime, "recordedAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer, CONSTRAINT "FK_58d2d30f23f80d11ba08925d05a" FOREIGN KEY ("debtId") REFERENCES "debts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_34706002799d24db5d9c4a94d01" FOREIGN KEY ("methodId") REFERENCES "payment_methods" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_payment_transactions"("id", "methodId", "amount", "paymentDate", "reference", "notes", "deletedAt", "recordedAt", "debtId") SELECT "id", "methodId", "amount", "paymentDate", "reference", "notes", "deletedAt", "recordedAt", "debtId" FROM "payment_transactions"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`ALTER TABLE "temporary_payment_transactions" RENAME TO "payment_transactions"`);
        await queryRunner.query(`CREATE TABLE "temporary_penalty_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "amount" decimal(12,2) NOT NULL, "penaltyDate" datetime NOT NULL, "reason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer, CONSTRAINT "FK_fbdfada962daff40335acff047a" FOREIGN KEY ("debtId") REFERENCES "debts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_penalty_transactions"("id", "amount", "penaltyDate", "reason", "deletedAt", "createdAt", "debtId") SELECT "id", "amount", "penaltyDate", "reason", "deletedAt", "createdAt", "debtId" FROM "penalty_transactions"`);
        await queryRunner.query(`DROP TABLE "penalty_transactions"`);
        await queryRunner.query(`ALTER TABLE "temporary_penalty_transactions" RENAME TO "penalty_transactions"`);
        await queryRunner.query(`CREATE TABLE "temporary_notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('error','info','reminder','overdue','payment_confirmation') ) NOT NULL DEFAULT ('reminder'), "isRead" boolean NOT NULL DEFAULT (0), "scheduledFor" datetime, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer, CONSTRAINT "FK_194ce7928ea662ef971dbd5567f" FOREIGN KEY ("debtId") REFERENCES "debts" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_notifications"("id", "title", "message", "type", "isRead", "scheduledFor", "deletedAt", "createdAt", "debtId") SELECT "id", "title", "message", "type", "isRead", "scheduledFor", "deletedAt", "createdAt", "debtId" FROM "notifications"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`ALTER TABLE "temporary_notifications" RENAME TO "notifications"`);
        await queryRunner.query(`CREATE TABLE "temporary_debtor_group_members" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "groupId" integer NOT NULL, "debtorId" integer NOT NULL, "assignedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_6f27c445ddd04575a2639e7a955" UNIQUE ("groupId", "debtorId"), CONSTRAINT "FK_bc625b8e7210ff1ad2c63c4946d" FOREIGN KEY ("groupId") REFERENCES "debtor_groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_2b25724b9a118dd3cd04c39536d" FOREIGN KEY ("debtorId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_debtor_group_members"("id", "groupId", "debtorId", "assignedAt") SELECT "id", "groupId", "debtorId", "assignedAt" FROM "debtor_group_members"`);
        await queryRunner.query(`DROP TABLE "debtor_group_members"`);
        await queryRunner.query(`ALTER TABLE "temporary_debtor_group_members" RENAME TO "debtor_group_members"`);
        await queryRunner.query(`CREATE TABLE "temporary_loan_applications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer, "debtorName" varchar NOT NULL, "debtorContact" varchar, "debtorEmail" varchar, "debtorAddress" varchar, "requestedAmount" decimal(12,2) NOT NULL, "purpose" varchar NOT NULL, "proposedDueDate" datetime NOT NULL, "interestRate" decimal(5,2), "status" varchar CHECK( "status" IN ('pending','approved','rejected') ) NOT NULL DEFAULT ('pending'), "approvedAt" datetime, "rejectedAt" datetime, "approvedBy" varchar, "rejectionReason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_e26977a3bf6356528a8114777e7" FOREIGN KEY ("debtorId") REFERENCES "borrowers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_loan_applications"("id", "debtorId", "debtorName", "debtorContact", "debtorEmail", "debtorAddress", "requestedAmount", "purpose", "proposedDueDate", "interestRate", "status", "approvedAt", "rejectedAt", "approvedBy", "rejectionReason", "deletedAt", "createdAt", "updatedAt") SELECT "id", "debtorId", "debtorName", "debtorContact", "debtorEmail", "debtorAddress", "requestedAmount", "purpose", "proposedDueDate", "interestRate", "status", "approvedAt", "rejectedAt", "approvedBy", "rejectionReason", "deletedAt", "createdAt", "updatedAt" FROM "loan_applications"`);
        await queryRunner.query(`DROP TABLE "loan_applications"`);
        await queryRunner.query(`ALTER TABLE "temporary_loan_applications" RENAME TO "loan_applications"`);
        await queryRunner.query(`CREATE TABLE "temporary_payment_method_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "transactionCount" integer NOT NULL DEFAULT (0), "totalAmount" decimal(12,2) NOT NULL DEFAULT (0), "methodId" integer, CONSTRAINT "REL_cbca66b221854a9be2bf81d324" UNIQUE ("methodId"), CONSTRAINT "FK_cbca66b221854a9be2bf81d3242" FOREIGN KEY ("methodId") REFERENCES "payment_methods" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_payment_method_stats"("id", "transactionCount", "totalAmount", "methodId") SELECT "id", "transactionCount", "totalAmount", "methodId" FROM "payment_method_stats"`);
        await queryRunner.query(`DROP TABLE "payment_method_stats"`);
        await queryRunner.query(`ALTER TABLE "temporary_payment_method_stats" RENAME TO "payment_method_stats"`);
        await queryRunner.query(`CREATE TABLE "temporary_credit_check_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer NOT NULL, "score" integer NOT NULL DEFAULT (0), "riskLevel" varchar CHECK( "riskLevel" IN ('Low','Medium','High') ) NOT NULL, "remarks" varchar, "dateChecked" datetime NOT NULL DEFAULT (datetime('now')), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_dbb4adbe65fb9aa38f00c311e48" FOREIGN KEY ("debtorId") REFERENCES "borrowers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_credit_check_logs"("id", "debtorId", "score", "riskLevel", "remarks", "dateChecked", "createdAt") SELECT "id", "debtorId", "score", "riskLevel", "remarks", "dateChecked", "createdAt" FROM "credit_check_logs"`);
        await queryRunner.query(`DROP TABLE "credit_check_logs"`);
        await queryRunner.query(`ALTER TABLE "temporary_credit_check_logs" RENAME TO "credit_check_logs"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "credit_check_logs" RENAME TO "temporary_credit_check_logs"`);
        await queryRunner.query(`CREATE TABLE "credit_check_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer NOT NULL, "score" integer NOT NULL DEFAULT (0), "riskLevel" varchar CHECK( "riskLevel" IN ('Low','Medium','High') ) NOT NULL, "remarks" varchar, "dateChecked" datetime NOT NULL DEFAULT (datetime('now')), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "credit_check_logs"("id", "debtorId", "score", "riskLevel", "remarks", "dateChecked", "createdAt") SELECT "id", "debtorId", "score", "riskLevel", "remarks", "dateChecked", "createdAt" FROM "temporary_credit_check_logs"`);
        await queryRunner.query(`DROP TABLE "temporary_credit_check_logs"`);
        await queryRunner.query(`ALTER TABLE "payment_method_stats" RENAME TO "temporary_payment_method_stats"`);
        await queryRunner.query(`CREATE TABLE "payment_method_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "transactionCount" integer NOT NULL DEFAULT (0), "totalAmount" decimal(12,2) NOT NULL DEFAULT (0), "methodId" integer, CONSTRAINT "REL_cbca66b221854a9be2bf81d324" UNIQUE ("methodId"))`);
        await queryRunner.query(`INSERT INTO "payment_method_stats"("id", "transactionCount", "totalAmount", "methodId") SELECT "id", "transactionCount", "totalAmount", "methodId" FROM "temporary_payment_method_stats"`);
        await queryRunner.query(`DROP TABLE "temporary_payment_method_stats"`);
        await queryRunner.query(`ALTER TABLE "loan_applications" RENAME TO "temporary_loan_applications"`);
        await queryRunner.query(`CREATE TABLE "loan_applications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer, "debtorName" varchar NOT NULL, "debtorContact" varchar, "debtorEmail" varchar, "debtorAddress" varchar, "requestedAmount" decimal(12,2) NOT NULL, "purpose" varchar NOT NULL, "proposedDueDate" datetime NOT NULL, "interestRate" decimal(5,2), "status" varchar CHECK( "status" IN ('pending','approved','rejected') ) NOT NULL DEFAULT ('pending'), "approvedAt" datetime, "rejectedAt" datetime, "approvedBy" varchar, "rejectionReason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "loan_applications"("id", "debtorId", "debtorName", "debtorContact", "debtorEmail", "debtorAddress", "requestedAmount", "purpose", "proposedDueDate", "interestRate", "status", "approvedAt", "rejectedAt", "approvedBy", "rejectionReason", "deletedAt", "createdAt", "updatedAt") SELECT "id", "debtorId", "debtorName", "debtorContact", "debtorEmail", "debtorAddress", "requestedAmount", "purpose", "proposedDueDate", "interestRate", "status", "approvedAt", "rejectedAt", "approvedBy", "rejectionReason", "deletedAt", "createdAt", "updatedAt" FROM "temporary_loan_applications"`);
        await queryRunner.query(`DROP TABLE "temporary_loan_applications"`);
        await queryRunner.query(`ALTER TABLE "debtor_group_members" RENAME TO "temporary_debtor_group_members"`);
        await queryRunner.query(`CREATE TABLE "debtor_group_members" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "groupId" integer NOT NULL, "debtorId" integer NOT NULL, "assignedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_6f27c445ddd04575a2639e7a955" UNIQUE ("groupId", "debtorId"))`);
        await queryRunner.query(`INSERT INTO "debtor_group_members"("id", "groupId", "debtorId", "assignedAt") SELECT "id", "groupId", "debtorId", "assignedAt" FROM "temporary_debtor_group_members"`);
        await queryRunner.query(`DROP TABLE "temporary_debtor_group_members"`);
        await queryRunner.query(`ALTER TABLE "notifications" RENAME TO "temporary_notifications"`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('error','info','reminder','overdue','payment_confirmation') ) NOT NULL DEFAULT ('reminder'), "isRead" boolean NOT NULL DEFAULT (0), "scheduledFor" datetime, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer)`);
        await queryRunner.query(`INSERT INTO "notifications"("id", "title", "message", "type", "isRead", "scheduledFor", "deletedAt", "createdAt", "debtId") SELECT "id", "title", "message", "type", "isRead", "scheduledFor", "deletedAt", "createdAt", "debtId" FROM "temporary_notifications"`);
        await queryRunner.query(`DROP TABLE "temporary_notifications"`);
        await queryRunner.query(`ALTER TABLE "penalty_transactions" RENAME TO "temporary_penalty_transactions"`);
        await queryRunner.query(`CREATE TABLE "penalty_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "amount" decimal(12,2) NOT NULL, "penaltyDate" datetime NOT NULL, "reason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer)`);
        await queryRunner.query(`INSERT INTO "penalty_transactions"("id", "amount", "penaltyDate", "reason", "deletedAt", "createdAt", "debtId") SELECT "id", "amount", "penaltyDate", "reason", "deletedAt", "createdAt", "debtId" FROM "temporary_penalty_transactions"`);
        await queryRunner.query(`DROP TABLE "temporary_penalty_transactions"`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" RENAME TO "temporary_payment_transactions"`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "methodId" integer, "amount" decimal(12,2) NOT NULL, "paymentDate" datetime NOT NULL, "reference" varchar, "notes" varchar, "deletedAt" datetime, "recordedAt" datetime NOT NULL DEFAULT (datetime('now')), "debtId" integer)`);
        await queryRunner.query(`INSERT INTO "payment_transactions"("id", "methodId", "amount", "paymentDate", "reference", "notes", "deletedAt", "recordedAt", "debtId") SELECT "id", "methodId", "amount", "paymentDate", "reference", "notes", "deletedAt", "recordedAt", "debtId" FROM "temporary_payment_transactions"`);
        await queryRunner.query(`DROP TABLE "temporary_payment_transactions"`);
        await queryRunner.query(`ALTER TABLE "loan_agreements" RENAME TO "temporary_loan_agreements"`);
        await queryRunner.query(`CREATE TABLE "loan_agreements" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "agreementDate" datetime, "lenderName" varchar, "termsText" text, "filePath" varchar, "deletedAt" datetime, "debtId" integer)`);
        await queryRunner.query(`INSERT INTO "loan_agreements"("id", "agreementDate", "lenderName", "termsText", "filePath", "deletedAt", "debtId") SELECT "id", "agreementDate", "lenderName", "termsText", "filePath", "deletedAt", "debtId" FROM "temporary_loan_agreements"`);
        await queryRunner.query(`DROP TABLE "temporary_loan_agreements"`);
        await queryRunner.query(`ALTER TABLE "debts" RENAME TO "temporary_debts"`);
        await queryRunner.query(`CREATE TABLE "debts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "totalAmount" decimal(12,2) NOT NULL, "paidAmount" decimal(12,2) NOT NULL DEFAULT (0), "remainingAmount" decimal(12,2) NOT NULL DEFAULT (0), "dueDate" datetime NOT NULL, "status" varchar CHECK( "status" IN ('active','paid','overdue','defaulted') ) NOT NULL DEFAULT ('active'), "interestRate" decimal(5,2), "penaltyRate" decimal(5,2), "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "borrowerId" integer)`);
        await queryRunner.query(`INSERT INTO "debts"("id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "borrowerId") SELECT "id", "name", "totalAmount", "paidAmount", "remainingAmount", "dueDate", "status", "interestRate", "penaltyRate", "deletedAt", "createdAt", "updatedAt", "borrowerId" FROM "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "temporary_debts"`);
        await queryRunner.query(`DROP TABLE "credit_check_logs"`);
        await queryRunner.query(`DROP TABLE "printers"`);
        await queryRunner.query(`DROP TABLE "payment_method_stats"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "loan_applications"`);
        await queryRunner.query(`DROP TABLE "debtor_group_members"`);
        await queryRunner.query(`DROP TABLE "debtor_groups"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_status_created"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_recipient"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_status"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP INDEX "idx_ir_log_changed_at"`);
        await queryRunner.query(`DROP INDEX "idx_ir_log_changed_by"`);
        await queryRunner.query(`DROP INDEX "idx_ir_log_key"`);
        await queryRunner.query(`DROP TABLE "interest_rate_change_logs"`);
        await queryRunner.query(`DROP INDEX "idx_system_settings_type_key"`);
        await queryRunner.query(`DROP TABLE "system_settings"`);
        await queryRunner.query(`DROP INDEX "idx_license_status_expires"`);
        await queryRunner.query(`DROP INDEX "idx_next_sync"`);
        await queryRunner.query(`DROP INDEX "idx_expires_at"`);
        await queryRunner.query(`DROP INDEX "idx_license_key"`);
        await queryRunner.query(`DROP TABLE "license_cache"`);
        await queryRunner.query(`DROP TABLE "penalty_transactions"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`DROP TABLE "loan_agreements"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`DROP TABLE "borrowers"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }
}
