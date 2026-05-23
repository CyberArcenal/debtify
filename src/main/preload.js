// preload.js (updated with printer-specific methods)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendAPI", {
  // ========== WINDOW CONTROL ==========
  windowControl: (payload) => ipcRenderer.invoke("window-control", payload),

  // ========== EXISTING MODULES ==========
  auditLog: (payload) => ipcRenderer.invoke("auditLog", payload),
  activation: (payload) => ipcRenderer.invoke("activation", payload),
  systemConfig: (payload) => ipcRenderer.invoke("systemConfig", payload),
  dashboard: (payload) => ipcRenderer.invoke("dashboard", payload),
  reminderLog: (payload) => ipcRenderer.invoke("reminderLog", payload),
  notificationLog: (payload) => ipcRenderer.invoke("notificationLog", payload),
  notification: (payload) => ipcRenderer.invoke("notification", payload),
  updater: (payload) => ipcRenderer.invoke("updater", payload),
  handshake: (payload) => ipcRenderer.invoke("handshake", payload),
  // ========== CORE DEBT MANAGEMENT MODULES ==========
  borrower: (payload) => ipcRenderer.invoke("borrower", payload),
  debt: (payload) => ipcRenderer.invoke("debt", payload),
  loanAgreement: (payload) => ipcRenderer.invoke("loanAgreement", payload),
  paymentTransaction: (payload) =>
    ipcRenderer.invoke("paymentTransaction", payload),
  penaltyTransaction: (payload) =>
    ipcRenderer.invoke("penaltyTransaction", payload),

  // ========== NEW DEBT MANAGEMENT MODULES ==========
  group: (payload) => ipcRenderer.invoke("group", payload),
  loanApplication: (payload) => ipcRenderer.invoke("loanApplication", payload),
  paymentMethod: (payload) => ipcRenderer.invoke("paymentMethod", payload),
  creditCheck: (payload) => ipcRenderer.invoke("creditCheck", payload),
  interestRateChangeLog: (payload) =>
    ipcRenderer.invoke("interestRateChangeLog", payload),

  // ========== PRINTER MODULE (generic + specific methods) ==========
  // Generic handler for printer configuration (CRUD, test, etc.)
  printer: (payload) => ipcRenderer.invoke("printer", payload),

  // Dedicated printer convenience methods
  printerGetStatus: () => ipcRenderer.invoke("printer:get-status"),
  printerIsAvailable: () => ipcRenderer.invoke("printer:is-available"),
  printerReload: () => ipcRenderer.invoke("printer:reload"),
  printerPrint: (sale) => ipcRenderer.invoke("printer:print", sale),
  printerTestPrint: () => ipcRenderer.invoke("printer:test-print"),

  // ========== UTILITIES ==========
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  notifyAppReady: () => ipcRenderer.send("app:renderer-ready"),

  // ========== EVENT LISTENERS ==========
  onAppReady: (callback) => {
    ipcRenderer.on("app-ready", callback);
    return () => ipcRenderer.removeListener("app-ready", callback);
  },
  on: (event, callback) => {
    ipcRenderer.on(event, callback);
    return () => ipcRenderer.removeListener(event, callback);
  },
  off: (channel, callback) => ipcRenderer.removeListener(channel, callback),

  // ========== WINDOW STATE EVENTS ==========
  onWindowMaximized: (callback) =>
    ipcRenderer.on("window:maximized", () => callback()),
  onWindowRestored: (callback) =>
    ipcRenderer.on("window:restored", () => callback()),
  onWindowMinimized: (callback) =>
    ipcRenderer.on("window:minimized", () => callback()),
  onWindowClosed: (callback) =>
    ipcRenderer.on("window:closed", () => callback()),
  onWindowResized: (callback) =>
    ipcRenderer.on("window:resized", (event, bounds) => callback(bounds)),
  onWindowMoved: (callback) =>
    ipcRenderer.on("window:moved", (event, position) => callback(position)),

  // ========== LOGGING ==========
  log: {
    info: (message, data) => console.log("[Renderer]", message, data),
    error: (message, error) => console.error("[Renderer]", message, error),
    warn: (message, warning) => console.warn("[Renderer]", message, warning),
  },
});
