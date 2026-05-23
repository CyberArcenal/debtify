/**
 * Hook to get the current database schema version.
 * This should be kept in sync with your actual DB schema.
 * You can later fetch it from the database or a configuration file.
 */
export const useSchemaVersion = () => {
  // Update this constant whenever you change the database schema.
  const SCHEMA_VERSION = "3";
  return { schemaVersion: SCHEMA_VERSION };
};