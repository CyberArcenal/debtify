// src/main/ipc/dashboard/get/statistics.ipc.js
const Borrower = require("../../../../../entities/Borrower");
const Debt = require("../../../../../entities/Debt");
const PaymentTransaction = require("../../../../../entities/PaymentTransaction");
const PenaltyTransaction = require("../../../../../entities/PenaltyTransaction");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/dashboard/statistics');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Statistics retrieved from server", data: result.data };
  } else {
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

    const totalRemaining = await debtRepo
      .createQueryBuilder("debt")
      .select("SUM(debt.remainingAmount)", "sum")
      .where("debt.status != :paid", { paid: "paid" })
      .andWhere("debt.deletedAt IS NULL")
      .getRawOne();

    return {
      status: true,
      message: "Statistics retrieved locally",
      data: {
        totalBorrowers,
        totalDebts,
        totalPaidDebts,
        totalOverdue,
        totalPaymentsCollected: parseFloat(totalPayments.sum) || 0,
        totalPenaltiesCollected: parseFloat(totalPenalties.sum) || 0,
        totalRemainingBalance: parseFloat(totalRemaining.sum) || 0,
      },
    };
  }
};