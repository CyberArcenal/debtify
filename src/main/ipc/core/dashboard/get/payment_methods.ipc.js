// src/main/ipc/dashboard/get/payment_methods.ipc.js
// Kung may payment method field, dito ginagamit. Placeholder gamit ang reference.
//@ts-check
const { AuditLog } = require("../../../../../entities/AuditLog");
const PaymentTransaction = require("../../../../../entities/PaymentTransaction");
const { AppDataSource } = require("../../../../db/data-source");

module.exports = async () => {
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

  // Kung walang reference, pwedeng i‑group sa "Cash" bilang default
  if (methods.length === 0) {
    const total = await repo
      .createQueryBuilder("payment")
      .select("SUM(payment.amount)", "total")
      .where("payment.deletedAt IS NULL")
      .getRawOne();
    return {
      status: true,
      message: "Payment methods retrieved",
      data: [{ method: "Cash", total: parseFloat(total.total) || 0, count: 0 }],
    };
  }

  return {
    status: true,
    message: "Payment methods retrieved",
    data: methods.map(m => ({
      method: m.method || "Unknown",
      count: parseInt(m.count),
      total: parseFloat(m.total),
    })),
  };
};