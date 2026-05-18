// src/main/ipc/dashboard/get/statistics.ipc.js
//@ts-check
const { AuditLog } = require("../../../../../entities/AuditLog");
const Borrower = require("../../../../../entities/Borrower");
const Debt = require("../../../../../entities/Debt");
const PaymentTransaction = require("../../../../../entities/PaymentTransaction");
const PenaltyTransaction = require("../../../../../entities/PenaltyTransaction");
const { AppDataSource } = require("../../../../db/data-source");

module.exports = async () => {
  const borrowerRepo = AppDataSource.getRepository(Borrower);
  const debtRepo = AppDataSource.getRepository(Debt);
  const paymentRepo = AppDataSource.getRepository(PaymentTransaction);
  const penaltyRepo = AppDataSource.getRepository(PenaltyTransaction);

  const totalBorrowers = await borrowerRepo.count({ where: { deletedAt: null } });
  const totalDebts = await debtRepo.count({ where: { deletedAt: null } });
  const totalPaidDebts = await debtRepo.count({ where: { status: "paid", deletedAt: null } });
  const totalOverdue = await debtRepo.count({ where: { status: "overdue", deletedAt: null } });

  const totalPayments = await paymentRepo
    .createQueryBuilder("payment")
    .select("SUM(payment.amount)", "sum")
    .where("payment.deletedAt IS NULL")
    .getRawOne();

  const totalPenalties = await penaltyRepo
    .createQueryBuilder("penalty")
    .select("SUM(penalty.amount)", "sum")
    .where("penalty.deletedAt IS NULL")
    .getRawOne();

  // ➕ Calculate total remaining balance (unpaid debts)
  const totalRemaining = await debtRepo
    .createQueryBuilder("debt")
    .select("SUM(debt.remainingAmount)", "sum")
    .where("debt.status != :paid", { paid: "paid" })
    .andWhere("debt.deletedAt IS NULL")
    .getRawOne();

  return {
    status: true,
    message: "Dashboard statistics retrieved",
    data: {
      totalBorrowers,
      totalDebts,
      totalPaidDebts,
      totalOverdue,
      totalPaymentsCollected: parseFloat(totalPayments.sum) || 0,
      totalPenaltiesCollected: parseFloat(totalPenalties.sum) || 0,
      totalRemainingBalance: parseFloat(totalRemaining.sum) || 0, // ✅ added field
    },
  };
};