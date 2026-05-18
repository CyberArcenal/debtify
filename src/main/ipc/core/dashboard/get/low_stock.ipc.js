// src/main/ipc/dashboard/get/low_stock.ipc.js
// Kung walang Product entity, gumamit ng Debt na may dueDate o iba
//@ts-check
const { AuditLog } = require("../../../../../entities/AuditLog");
const Debt = require("../../../../../entities/Debt");
const { AppDataSource } = require("../../../../db/data-source");

module.exports = async (params) => {
  const repo = AppDataSource.getRepository(Debt);
  const { threshold = 5 } = params;
  // Placeholder: ipakita ang mga debt na due within 7 days
  const dueSoon = await repo
    .createQueryBuilder("debt")
    .where("debt.dueDate BETWEEN :today AND :nextWeek", {
      today: new Date(),
      nextWeek: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .andWhere("debt.status != 'paid'")
    .andWhere("debt.deletedAt IS NULL")
    .limit(10)
    .getMany();

  return {
    status: true,
    message: "Low stock / due soon retrieved",
    data: dueSoon.map(d => ({ id: d.id, name: d.name, dueDate: d.dueDate })),
  };
};