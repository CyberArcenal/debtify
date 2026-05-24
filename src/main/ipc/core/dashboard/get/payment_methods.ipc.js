// src/main/ipc/dashboard/get/payment_methods.ipc.js
const PaymentTransaction = require("../../../../../entities/PaymentTransaction");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/dashboard/payment-methods');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Payment methods retrieved from server", data: result.data };
  } else {
    const repo = AppDataSource.getRepository(PaymentTransaction);
    const methods = await repo
      .createQueryBuilder("payment")
      .select("payment.reference", "method")
      .addSelect("COUNT(payment.id)", "count")
      .addSelect("SUM(payment.amount)", "total")
      .where("payment.reference IS NOT NULL")
      .andWhere("payment.deletedAt IS NULL")
      .groupBy("payment.reference")
      .getRawMany();

    if (methods.length === 0) {
      const total = await repo
        .createQueryBuilder("payment")
        .select("SUM(payment.amount)", "total")
        .where("payment.deletedAt IS NULL")
        .getRawOne();
      return {
        status: true,
        message: "Payment methods retrieved locally",
        data: [{ method: "Cash", total: parseFloat(total.total) || 0, count: 0 }],
      };
    }

    return {
      status: true,
      message: "Payment methods retrieved locally",
      data: methods.map(m => ({
        method: m.method || "Unknown",
        count: parseInt(m.count),
        total: parseFloat(m.total),
      })),
    };
  }
};