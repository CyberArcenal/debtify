// src/main/ipc/audit/export_csv.ipc.js
//@ts-check
const { AuditLog } = require("../../../../entities/AuditLog");
const { AppDataSource } = require("../../../db/data-source");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // Use POST to send filters in body (since export may be large)
    const response = await onlineClient.post('/api/v1/audit/export', params);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "CSV exported from server", data: result.data };
  } else {
    const { searchTerm, entity, user, action, startDate, endDate, limit = 5000 } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (searchTerm) {
      qb = qb.andWhere(
        "(log.action LIKE :search OR log.entity LIKE :search OR log.user LIKE :search)",
        { search: `%${searchTerm}%` }
      );
    }
    if (entity) qb = qb.andWhere("log.entity = :entity", { entity });
    if (user) qb = qb.andWhere("log.user = :user", { user });
    if (action) qb = qb.andWhere("log.action = :action", { action });
    if (startDate && endDate) {
      qb = qb.andWhere("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const items = await qb.orderBy("log.timestamp", "DESC").take(Math.min(limit, 10000)).getMany();
    // Prepare CSV
    const headers = ["ID", "Action", "Entity", "EntityId", "User", "Timestamp", "OldData", "NewData"];
    const rows = items.map(log => [
      log.id,
      log.action,
      log.entity,
      log.entityId,
      log.user,
      log.timestamp.toISOString(),
      log.oldData ? JSON.stringify(log.oldData) : "",
      log.newData ? JSON.stringify(log.newData) : "",
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const tempDir = os.tmpdir();
    const filename = `audit_export_${Date.now()}.csv`;
    const filePath = path.join(tempDir, filename);
    await fs.writeFile(filePath, csvContent, "utf-8");
    return { status: true, message: "CSV exported locally", data: { filePath, filename } };
  }
};