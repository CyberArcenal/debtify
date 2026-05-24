// src/main/ipc/audit/get_counts.ipc.js
const { AuditLog } = require("../../../../entities/AuditLog");
const { AppDataSource } = require("../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/audit/counts', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Counts retrieved from server", data: result.data };
  } else {
    const { startDate, endDate } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (startDate && endDate) {
      qb = qb.where("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const byAction = await qb.clone()
      .select("log.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.action")
      .getRawMany();
    const byEntity = await qb.clone()
      .select("log.entity", "entity")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.entity")
      .getRawMany();
    const byUser = await qb.clone()
      .select("log.user", "user")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.user")
      .getRawMany();
    return { status: true, message: "Counts retrieved locally", data: { byAction, byEntity, byUser } };
  }
};