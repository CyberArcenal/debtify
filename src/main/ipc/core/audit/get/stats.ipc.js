// src/main/ipc/audit/get/stats.ipc.js

const { AuditLog } = require("../../../../../entities/AuditLog");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { AppDataSource } = require("../../../../db/data-source");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/audit/stats', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Audit statistics retrieved from server", data: result.data };
  } else {
    const { startDate, endDate } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (startDate && endDate) {
      qb = qb.where("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const total = await qb.clone().getCount();
    const uniqueUsers = await qb.clone().select("COUNT(DISTINCT log.user)", "count").getRawOne();
    const avgPerDay = await qb.clone()
      .select("COUNT(*) / COUNT(DISTINCT DATE(log.timestamp))", "avg")
      .getRawOne();
    const mostActiveDay = await qb.clone()
      .select("DATE(log.timestamp) as day, COUNT(*) as count")
      .groupBy("DATE(log.timestamp)")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();
    return {
      status: true,
      message: "Audit statistics retrieved locally",
      data: {
        total,
        avgPerDay: parseFloat(avgPerDay?.avg) || 0,
        mostActiveDay: mostActiveDay ? { day: mostActiveDay.day, count: parseInt(mostActiveDay.count) } : null,
        uniqueUsers: parseInt(uniqueUsers?.count) || 0,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
      },
    };
  }
};