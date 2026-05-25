// src/main/ipc/dashboard/get/revenue.ipc.js

const { Between } = require("typeorm");
const { AppDataSource } = require("../../../../db/data-source");
const PaymentTransaction = require("../../../../../entities/PaymentTransaction");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");


module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/dashboard/revenue', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Revenue retrieved from server", data: result.data };
  } else {
    const { period = "month", startDate, endDate } = params;
    const paymentRepo = AppDataSource.getRepository(PaymentTransaction);

    let dateFilter = {};
    const now = new Date();
    if (startDate && endDate) {
      dateFilter = { paymentDate: Between(new Date(startDate), new Date(endDate)) };
    } else if (period === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateFilter = { paymentDate: Between(today, tomorrow) };
    } else if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      dateFilter = { paymentDate: Between(start, now) };
    } else if (period === "month") {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      dateFilter = { paymentDate: Between(start, now) };
    } else if (period === "year") {
      const start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      dateFilter = { paymentDate: Between(start, now) };
    }

    const query = paymentRepo.createQueryBuilder("payment")
      .select("SUM(payment.amount)", "totalRevenue")
      .addSelect("COUNT(payment.id)", "transactionCount")
      .where("payment.deletedAt IS NULL");

    if (dateFilter.paymentDate) {
      query.andWhere("payment.paymentDate BETWEEN :start AND :end", {
        start: dateFilter.paymentDate._value1,
        end: dateFilter.paymentDate._value2,
      });
    }

    const result = await query.getRawOne();

    return {
      status: true,
      message: "Revenue retrieved locally",
      data: {
        totalRevenue: parseFloat(result.totalRevenue) || 0,
        transactionCount: parseInt(result.transactionCount) || 0,
        period,
      },
    };
  }
};