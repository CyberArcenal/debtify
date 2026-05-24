// src/main/ipc/audit/get/by_date_range.ipc.js
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
    const response = await onlineClient.get('/api/v1/audit/date-range', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Audit logs by date range retrieved from server", data: result.data };
  } else {
    const { startDate, endDate, page = 1, limit = 50 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const qb = repo.createQueryBuilder("log")
      .where("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) })
      .orderBy("log.timestamp", "DESC");
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      status: true,
      message: "Audit logs by date range retrieved locally",
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
};