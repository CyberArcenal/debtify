/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1779245828674 {
    name = 'InitSchema1779245828674'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_system_settings_type_key"`);
        await queryRunner.query(`CREATE TABLE "temporary_system_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar(100) NOT NULL, "value" text NOT NULL, "setting_type" varchar CHECK( "setting_type" IN ('general','collections','loans','notifications','reports','integrations','audit_security') ) NOT NULL, "description" text, "is_public" boolean NOT NULL DEFAULT (0), "is_deleted" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "temporary_system_settings"("id", "key", "value", "setting_type", "description", "is_public", "is_deleted", "created_at", "updated_at") SELECT "id", "key", "value", "setting_type", "description", "is_public", "is_deleted", "created_at", "updated_at" FROM "system_settings"`);
        await queryRunner.query(`DROP TABLE "system_settings"`);
        await queryRunner.query(`ALTER TABLE "temporary_system_settings" RENAME TO "system_settings"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_system_settings_type_key" ON "system_settings" ("setting_type", "key") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_system_settings_type_key"`);
        await queryRunner.query(`ALTER TABLE "system_settings" RENAME TO "temporary_system_settings"`);
        await queryRunner.query(`CREATE TABLE "system_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar(100) NOT NULL, "value" text NOT NULL, "setting_type" varchar CHECK( "setting_type" IN ('email','attendance','device','inventory_sync','general','inventory','sales','cashier','notifications','data_reports','integrations','audit_security') ) NOT NULL, "description" text, "is_public" boolean NOT NULL DEFAULT (0), "is_deleted" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "system_settings"("id", "key", "value", "setting_type", "description", "is_public", "is_deleted", "created_at", "updated_at") SELECT "id", "key", "value", "setting_type", "description", "is_public", "is_deleted", "created_at", "updated_at" FROM "temporary_system_settings"`);
        await queryRunner.query(`DROP TABLE "temporary_system_settings"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_system_settings_type_key" ON "system_settings" ("setting_type", "key") `);
    }
}
