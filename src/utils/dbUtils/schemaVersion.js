// src/utils/dbUtils/schemaVersion.js

/**
 * Get the current database schema version.
 * This should be incremented whenever you make breaking changes to entities
 * and need to run migrations.
 * Must be kept in sync with the version used in migrations.
 */
function getSchemaVersion() {
  // Update this constant when you change the database schema.
  // Example: after adding a new entity or changing column types.
  return "1";
}

module.exports = { getSchemaVersion };