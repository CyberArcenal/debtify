// src/main/ipc/audit/get/recent.ipc.js

const { AuditLog } = require("../../../../../entities/AuditLog");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/audit/recent', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Recent activities retrieved from server", data: result.data };
  } else {
    const { limit = 10 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const items = await repo.find({
      order: { timestamp: "DESC" },
      take: Math.min(limit, 50),
    });
    return { status: true, message: "Recent activities retrieved locally", data: { items, limit } };
  }
};