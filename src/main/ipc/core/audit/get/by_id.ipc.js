// src/main/ipc/audit/get/by_id.ipc.js
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
    const response = await onlineClient.get(`/api/v1/audit/logs/${params.id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Audit log retrieved from server", data: result.data };
  } else {
    const { id } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const item = await repo.findOne({ where: { id } });
    if (!item) {
      return { status: false, message: `Audit log with id ${id} not found`, data: null };
    }
    return { status: true, message: "Audit log retrieved locally", data: item };
  }
};