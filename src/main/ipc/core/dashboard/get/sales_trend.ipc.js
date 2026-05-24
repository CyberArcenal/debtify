// src/main/ipc/dashboard/get/sales_trend.ipc.js
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
    const response = await onlineClient.get('/api/v1/dashboard/sales-trend', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Sales trend retrieved from server", data: result.data };
  } else {
    const repo = AppDataSource.getRepository(PaymentTransaction);
    const { days = 7 } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const payments = await repo
      .createQueryBuilder("payment")
      .select("DATE(payment.paymentDate)", "date")
      .addSelect("SUM(payment.amount)", "total")
      .where("payment.paymentDate >= :startDate", { startDate })
      .andWhere("payment.deletedAt IS NULL")
      .groupBy("DATE(payment.paymentDate)")
      .orderBy("date", "ASC")
      .getRawMany();

    return {
      status: true,
      message: "Sales trend retrieved locally",
      data: payments.map(p => ({ date: p.date, total: parseFloat(p.total) })),
    };
  }
};