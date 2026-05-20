/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1779175588961 {
    name = 'InitSchema1779175588961'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "debtor_groups" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "color" varchar NOT NULL DEFAULT ('#3b82f6'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "debtor_group_members" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "groupId" integer NOT NULL, "debtorId" integer NOT NULL, "assignedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_6f27c445ddd04575a2639e7a955" UNIQUE ("groupId", "debtorId"))`);
        await queryRunner.query(`CREATE TABLE "loan_applications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer, "debtorName" varchar NOT NULL, "debtorContact" varchar, "debtorEmail" varchar, "debtorAddress" varchar, "requestedAmount" decimal(12,2) NOT NULL, "purpose" varchar NOT NULL, "proposedDueDate" datetime NOT NULL, "interestRate" decimal(5,2), "status" varchar CHECK( "status" IN ('pending','approved','rejected') ) NOT NULL DEFAULT ('pending'), "approvedAt" datetime, "rejectedAt" datetime, "approvedBy" varchar, "rejectionReason" varchar, "deletedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "icon" varchar NOT NULL DEFAULT ('CreditCard'), "isDefault" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "payment_method_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "transactionCount" integer NOT NULL DEFAULT (0), "totalAmount" decimal(12,2) NOT NULL DEFAULT (0), "methodId" integer, CONSTRAINT "REL_cbca66b221854a9be2bf81d324" UNIQUE ("methodId"))`);
        await queryRunner.query(`CREATE TABLE "printers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "interface" varchar CHECK( "interface" IN ('usb','network','bluetooth') ) NOT NULL, "connectionString" varchar NOT NULL, "isDefault" boolean NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('online','offline','error') ) NOT NULL DEFAULT ('offline'), "lastTested" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "credit_check_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "debtorId" integer NOT NULL, "score" integer NOT NULL DEFAULT (0), "riskLevel" varchar CHECK( "riskLevel" IN ('Low','Medium','High') ) NOT NULL, "remarks" varchar, "dateChecked" datetime NOT NULL DEFAULT (datetime('now')), "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
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
        await queryRunner.query(`DROP TABLE "credit_check_logs"`);
        await queryRunner.query(`DROP TABLE "printers"`);
        await queryRunner.query(`DROP TABLE "payment_method_stats"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "loan_applications"`);
        await queryRunner.query(`DROP TABLE "debtor_group_members"`);
        await queryRunner.query(`DROP TABLE "debtor_groups"`);
    }
}
