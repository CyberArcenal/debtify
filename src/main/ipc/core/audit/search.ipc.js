// src/main/ipc/audit/search.ipc.js
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
    const response = await onlineClient.get('/api/v1/audit/search', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Search completed on server", data: result.data };
  } else {
    const { searchTerm, entity, user, action, startDate, endDate, page = 1, limit = 50 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (searchTerm) {
      qb = qb.andWhere(
        "(log.action LIKE :search OR log.entity LIKE :search OR log.user LIKE :search OR CAST(log.entityId AS TEXT) LIKE :search)",
        { search: `%${searchTerm}%` }
      );
    }
    if (entity) qb = qb.andWhere("log.entity = :entity", { entity });
    if (user) qb = qb.andWhere("log.user = :user", { user });
    if (action) qb = qb.andWhere("log.action = :action", { action });
    if (startDate && endDate) {
      qb = qb.andWhere("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const [items, total] = await qb
      .orderBy("log.timestamp", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      status: true,
      message: "Search completed locally",
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
};