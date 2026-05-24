// src/main/ipc/audit/get_top_activities.ipc.js
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
    const response = await onlineClient.get('/api/v1/audit/top-activities', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Top activities retrieved from server", data: result.data };
  } else {
    const { limit = 10, startDate, endDate } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (startDate && endDate) {
      qb = qb.where("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const topActions = await qb.clone()
      .select("log.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.action")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
    const topEntities = await qb.clone()
      .select("log.entity", "entity")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.entity")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
    const topUsers = await qb.clone()
      .select("log.user", "user")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.user")
      .orderBy("count", "DESC")
      .limit(limit)
      .getRawMany();
    return { status: true, message: "Top activities retrieved locally", data: { topActions, topEntities, topUsers } };
  }
};