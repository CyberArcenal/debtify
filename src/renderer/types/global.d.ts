// global.d.ts (or src/renderer/types/global.d.ts)

export {};

declare global {
  interface Window {
    backendAPI: {
      // ========== CORE MODULES ==========
      auditLog: (payload: any) => Promise<any>;
      activation: (payload: any) => Promise<any>;
      notification: (payload: any) => Promise<any>;
      reminderLog: (payload: any) => Promise<any>;
      notificationLog: (payload: any) => Promise<any>;
      systemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      dashboard: (payload: any) => Promise<any>;
      updater: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      handshake: (payload: any) => Promise<any>;

      // ========== DEBT MANAGEMENT MODULES ==========
      borrower: (payload: any) => Promise<any>;
      debt: (payload: any) => Promise<any>;
      loanAgreement: (payload: any) => Promise<any>;
      paymentTransaction: (payload: any) => Promise<any>;
      penaltyTransaction: (payload: any) => Promise<any>;
      interestRateChangeLog: (payload: any) => Promise<any>;

      // ========== NEW DEBT MANAGEMENT MODULES ==========
      group: (payload: any) => Promise<any>;
      loanApplication: (payload: any) => Promise<any>;
      paymentMethod: (payload: any) => Promise<any>;
      printer: (payload: any) => Promise<any>;
      creditCheck: (payload: any) => Promise<any>;

      // ========== PRINTER CONVENIENCE METHODS ==========
      printerGetStatus: () => Promise<{ driverLoaded: boolean; isReady: boolean }>;
      printerIsAvailable: () => Promise<boolean>;
      printerReload: () => Promise<{ driverLoaded: boolean; isReady: boolean }>;
      printerPrint: (sale: any) => Promise<boolean>;
      printerTestPrint: () => Promise<boolean>;

      // ========== UTILITIES & WINDOW CONTROL ==========
      windowControl: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<{
        status: boolean;
        message: string;
        data?: any;
      }>;
      openExternal: (url: string) => Promise<void>;
      notifyAppReady: () => void;

      // ========== EVENT LISTENERS (direct callbacks) ==========
      onAppReady: (callback: () => void) => () => void;
      on: (
        channel: string,
        callback: (event: any, ...args: any[]) => void
      ) => () => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;

      // ========== WINDOW STATE EVENTS ==========
      onWindowMaximized: (callback: () => void) => void;
      onWindowRestored: (callback: () => void) => void;
      onWindowMinimized: (callback: () => void) => void;
      onWindowClosed: (callback: () => void) => void;
      onWindowResized: (callback: (bounds: any) => void) => void;
      onWindowMoved: (callback: (position: any) => void) => void;

      // ========== LOGGING ==========
      log: {
        info: (message: string, data?: any) => void;
        error: (message: string, error?: any) => void;
        warn: (message: string, warning?: any) => void;
      };
    };
  }
}