import { version } from "../../../package.json";

/**
 * Hook to get the current application version from package.json
 * @returns { version: string } The app version (e.g., "1.2.0")
 */
export const useVersion = () => {
  return { version };
};