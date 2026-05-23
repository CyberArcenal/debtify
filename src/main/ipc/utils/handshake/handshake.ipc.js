// src/main/ipc/core/handshake/index.ipc.js

const { version } = require("../../../../../package.json");
const { getSchemaVersion } = require("../../../../utils/dbUtils/schemaVersion");

const fetch = require("electron-fetch").default || window.fetch;

module.exports = async (params) => {
  const { serverUrl, licenseKey = "" } = params;
  if (!serverUrl) {
    return { status: false, message: "Server URL is required", data: null };
  }

  const requestPayload = {
    client_version: version,
    db_schema_version: getSchemaVersion(),
    platform: "electron",
    license_key: licenseKey,
    timestamp: new Date().toISOString(),
  };

  const url = `${serverUrl.replace(/\/$/, "")}/handshake`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();

    // If handshake successful, save sync settings to database
    if (data && data.status === "ok") {
      const { setSyncSettings } = require("../../../../utils/system");
      await setSyncSettings("online", serverUrl);
    }

    return { status: true, message: "Handshake completed", data };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      status: false,
      message: err.message || "Network error",
      data: { status: "error", message: err.message },
    };
  }
};
