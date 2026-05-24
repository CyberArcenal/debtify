// src/main/ipc/audit/get/by_user.ipc.js
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
    const response = await onlineClient.get('/api/v1/audit/user', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Audit logs by user retrieved from server", data: result.data };
  } else {
    const { user, page = 1, limit = 50 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    const qb = repo.createQueryBuilder("log")
      .where("log.user = :user", { user })
      .orderBy("log.timestamp", "DESC");
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      status: true,
      message: "Audit logs by user retrieved locally",
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
};