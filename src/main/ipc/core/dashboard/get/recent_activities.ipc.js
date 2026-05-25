// src/main/ipc/dashboard/get/recent_activities.ipc.js
const { AuditLog } = require("../../../../../entities/AuditLog");
const PaymentTransaction = require("../../../../../entities/PaymentTransaction");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/dashboard/recent-activities', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Recent activities retrieved from server", data: result.data };
  } else {
    const { limit = 10 } = params;
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const paymentRepo = AppDataSource.getRepository(PaymentTransaction);

    const recentAuditLogs = await auditRepo.find({
      order: { timestamp: "DESC" },
      take: Math.min(limit, 20),
    });

    const recentPayments = await paymentRepo.find({
      where: { deletedAt: null },
      relations: ["debt", "debt.borrower"],
      order: { paymentDate: "DESC" },
      take: Math.min(limit, 10),
    });

    const activities = [];

    for (const log of recentAuditLogs) {
      activities.push({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        user: log.user || "system",
        timestamp: log.timestamp.toISOString(),
        details: `${log.action} on ${log.entity}${log.entityId ? ` #${log.entityId}` : ""}`,
      });
    }

    for (const payment of recentPayments) {
      activities.push({
        id: `payment_${payment.id}`,
        action: "PAYMENT",
        entity: "PaymentTransaction",
        entityId: payment.id,
        user: payment.reference || "customer",
        timestamp: payment.paymentDate.toISOString(),
        details: `Payment of ${payment.amount} for debt #${payment.debt?.id}`,
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    return {
      status: true,
      message: "Recent activities retrieved locally",
      data: limitedActivities,
    };
  }
};