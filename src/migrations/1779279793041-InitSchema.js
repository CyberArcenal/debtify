/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1779279793041 {
    name = 'InitSchema1779279793041'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "interest_rate_change_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "setting_key" varchar NOT NULL, "old_value" decimal(5,2), "new_value" decimal(5,2), "changed_by" varchar NOT NULL DEFAULT ('system'), "reason" text, "changed_at" datetime NOT NULL DEFAULT (datetime('now')), "loan_id" integer)`);
        await queryRunner.query(`CREATE INDEX "idx_ir_log_key" ON "interest_rate_change_logs" ("setting_key") `);
        await queryRunner.query(`CREATE INDEX "idx_ir_log_changed_by" ON "interest_rate_change_logs" ("changed_by") `);
        await queryRunner.query(`CREATE INDEX "idx_ir_log_changed_at" ON "interest_rate_change_logs" ("changed_at") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_ir_log_changed_at"`);
        await queryRunner.query(`DROP INDEX "idx_ir_log_changed_by"`);
        await queryRunner.query(`DROP INDEX "idx_ir_log_key"`);
        await queryRunner.query(`DROP TABLE "interest_rate_change_logs"`);
    }
}
