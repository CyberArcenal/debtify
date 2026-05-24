// src/main/ipc/audit/generate_report.ipc.js
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
    const response = await onlineClient.post('/api/v1/audit/report', params);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Report generated on server", data: result.data };
  } else {
    const { startDate, endDate, format = "json" } = params;
    const repo = AppDataSource.getRepository(AuditLog);
    let qb = repo.createQueryBuilder("log");
    if (startDate && endDate) {
      qb = qb.where("log.timestamp BETWEEN :start AND :end", { start: new Date(startDate), end: new Date(endDate) });
    }
    const logs = await qb.orderBy("log.timestamp", "DESC").getMany();
    const total = logs.length;
    const byAction = {};
    const byEntity = {};
    const byUser = {};
    logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntity[log.entity] = (byEntity[log.entity] || 0) + 1;
      if (log.user) byUser[log.user] = (byUser[log.user] || 0) + 1;
    });
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
      total,
      summary: { byAction, byEntity, byUser },
      logs: format === "html" ? logs.slice(0, 500) : logs,
    };
    const tempDir = os.tmpdir();
    let filePath, content;
    if (format === "html") {
      content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Audit Report</title><style>body{font-family:sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}</style></head><body>
        <h1>Audit Log Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <h2>Summary</h2>
        <h3>By Action</h3><ul>${Object.entries(byAction).map(([k,v]) => `<li>${k}: ${v}</li>`).join("")}</ul>
        <h3>By Entity</h3><ul>${Object.entries(byEntity).map(([k,v]) => `<li>${k}: ${v}</li>`).join("")}</ul>
        <h3>By User</h3><ul>${Object.entries(byUser).map(([k,v]) => `<li>${k}: ${v}</li>`).join("")}</ul>
        <h2>Logs (latest 500)</h2><table><td><th>ID</th><th>Action</th><th>Entity</th><th>EntityId</th><th>User</th><th>Timestamp</th></tr>
        ${reportData.logs.map(log => `<tr><td>${log.id}</td><td>${log.action}</td><td>${log.entity}</td><td>${log.entityId}</td><td>${log.user}</td><td>${log.timestamp}</td></tr>`).join("")}
        </table></body></html>`;
      const filename = `audit_report_${Date.now()}.html`;
      filePath = path.join(tempDir, filename);
      await fs.writeFile(filePath, content, "utf-8");
    } else {
      const filename = `audit_report_${Date.now()}.json`;
      filePath = path.join(tempDir, filename);
      await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), "utf-8");
    }
    return { status: true, message: "Report generated locally", data: { filePath, format, entryCount: logs.length } };
  }
};