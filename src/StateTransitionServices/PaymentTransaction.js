// src/services/PaymentTransactionStateTransitionService.js
const PaymentTransaction = require("../entities/PaymentTransaction");
const Debt = require("../entities/Debt");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const notificationService = require("../services/Notification");

class PaymentTransactionStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.paymentRepo = dataSource.getRepository(PaymentTransaction);
    this.debtRepo = dataSource.getRepository(Debt);
  }

  _getRepo(qr, entityClass) {
    if (qr) return qr.manager.getRepository(entityClass);
    return this.dataSource.getRepository(entityClass);
  }

  /**
   * Helper: reload debt with borrower relation (transactional)
   */
  async _getDebtWithBorrower(debtId, queryRunner) {
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({
      where: { id: debtId },
      relations: ["borrower"],
    });
    if (!debt) throw new Error(`Debt #${debtId} not found`);
    return debt;
  }

  async applyPayment(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Applying payment #${payment.id} of ${payment.amount} to debt #${payment.debt?.id}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    debt.paidAmount = (debt.paidAmount || 0) + payment.amount;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount - payment.amount },
      { paidAmount: debt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment #${payment.id} applied. Debt #${debt.id} now has paidAmount=${debt.paidAmount}, remaining=${debt.remainingAmount}`,
    );
  }

  async reversePayment(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Reversing payment #${payment.id} of ${payment.amount} from debt #${payment.debt?.id}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    debt.paidAmount = Math.max(0, (debt.paidAmount || 0) - payment.amount);
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount + payment.amount },
      { paidAmount: debt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment #${payment.id} reversed. Debt #${debt.id} now has paidAmount=${debt.paidAmount}, remaining=${debt.remainingAmount}`,
    );
  }

  async updatePaymentAmount(
    payment,
    oldAmount,
    newAmount,
    user = "system",
    queryRunner = null,
  ) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    if (oldAmount === newAmount) return;
    const diff = newAmount - oldAmount;
    logger.info(
      `[Transition] Updating payment #${payment.id} amount from ${oldAmount} to ${newAmount} (diff=${diff})`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    debt.paidAmount = (debt.paidAmount || 0) + diff;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount - diff },
      { paidAmount: debt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment amount updated. Debt #${debt.id} now has paidAmount=${debt.paidAmount}, remaining=${debt.remainingAmount}`,
    );
  }

  async transferPayment(
    payment,
    oldDebtId,
    newDebtId,
    user = "system",
    queryRunner = null,
  ) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Transferring payment #${payment.id} from debt ${oldDebtId} to ${newDebtId}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const oldDebt = await debtRepo.findOne({ where: { id: oldDebtId } });
    const newDebt = await debtRepo.findOne({ where: { id: newDebtId } });
    if (!oldDebt || !newDebt) throw new Error("Old or new debt not found");

    oldDebt.paidAmount = Math.max(0, oldDebt.paidAmount - payment.amount);
    oldDebt.remainingAmount = oldDebt.totalAmount - oldDebt.paidAmount;
    if (oldDebt.remainingAmount < 0) oldDebt.remainingAmount = 0;
    oldDebt.updatedAt = new Date();
    await updateDb(debtRepo, oldDebt, { queryRunner, skipSignal: true });

    newDebt.paidAmount = (newDebt.paidAmount || 0) + payment.amount;
    newDebt.remainingAmount = newDebt.totalAmount - newDebt.paidAmount;
    if (newDebt.remainingAmount < 0) newDebt.remainingAmount = 0;
    newDebt.updatedAt = new Date();
    await updateDb(debtRepo, newDebt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      oldDebt.id,
      { paidAmount: oldDebt.paidAmount + payment.amount },
      { paidAmount: oldDebt.paidAmount },
      user,
    );
    await auditLogger.logUpdate(
      "Debt",
      newDebt.id,
      { paidAmount: newDebt.paidAmount - payment.amount },
      { paidAmount: newDebt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment transferred. Old debt #${oldDebtId} paidAmount=${oldDebt.paidAmount}, new debt #${newDebtId} paidAmount=${newDebt.paidAmount}`,
    );
  }

  async onVoid(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Voiding payment #${payment.id} by ${user}`);

    await this.reversePayment(payment, user, queryRunner);

    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    payment.voided = true;
    payment.updatedAt = new Date();
    await updateDb(paymentRepo, payment, { queryRunner, skipSignal: true });

    // Reload debt with borrower for notification
    const debtWithBorrower = await this._getDebtWithBorrower(
      payment.debt.id,
      queryRunner,
    );
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Payment Voided",
          message: `Your payment of ${payment.amount} for debt "${debtWithBorrower.name}" has been voided.`,
          type: "info",
          metadata: { paymentId: payment.id, debtId: payment.debt.id },
        },
        user,
        queryRunner,
      );
    }

    await auditLogger.logUpdate(
      "PaymentTransaction",
      payment.id,
      { status: "active" },
      { status: "voided" },
      user,
    );
  }

  async onRefund(payment, refundAmount, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Refunding ${refundAmount} from payment #${payment.id} by ${user}`,
    );

    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    // Create refund transaction record (negative amount)
    const refund = paymentRepo.create({
      amount: -refundAmount,
      paymentDate: new Date(),
      reference: `Refund for #${payment.id}`,
      notes: `Refund processed by ${user}`,
      debt: debt,
    });
    await saveDb(paymentRepo, refund, { queryRunner, skipSignal: true });

    // Update debt (subtract refund amount from paidAmount)
    debt.paidAmount = Math.max(0, debt.paidAmount - refundAmount);
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    // Reload debt with borrower for notification
    const debtWithBorrower = await this._getDebtWithBorrower(
      debt.id,
      queryRunner,
    );
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Payment Refunded",
          message: `A refund of ${refundAmount} has been issued for your payment of ${payment.amount} on debt "${debtWithBorrower.name}".`,
          type: "info",
          metadata: { paymentId: payment.id, refundAmount },
        },
        user,
        queryRunner,
      );
    }

    await auditLogger.logCreate("PaymentTransaction", refund.id, refund, user);
    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount + refundAmount },
      { paidAmount: debt.paidAmount },
      user,
    );
  }

  async onConfirm(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Confirming payment #${payment.id} by ${user}`);

    // 1. Apply payment (update debt paidAmount, remainingAmount)
    await this.applyPayment(payment, user, queryRunner);

    // 2. Reload debt to get updated remainingAmount (with borrower for later)
    const debtWithBorrower = await this._getDebtWithBorrower(
      payment.debt.id,
      queryRunner,
    );

    // 3. If debt is fully paid, mark status as 'paid'
    if (
      debtWithBorrower.remainingAmount <= 0 &&
      debtWithBorrower.status !== "paid"
    ) {
      const debtRepo = this._getRepo(queryRunner, Debt);
      debtWithBorrower.status = "paid";
      debtWithBorrower.updatedAt = new Date();
      await updateDb(debtRepo, debtWithBorrower, {
        queryRunner,
        skipSignal: false,
      });
      logger.info(
        `[Transition] Debt #${debtWithBorrower.id} fully paid, status updated to 'paid'`,
      );
    }

    // 4. Update payment record: mark as confirmed
    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    payment.confirmed = true;
    payment.updatedAt = new Date();
    await updateDb(paymentRepo, payment, { queryRunner, skipSignal: true });

    // 5. Receipt printing (non-critical, use setTimeout)
    try {
      const printerService = require("../services/Printer");
      setTimeout(async () => {
        try {
          await printerService.printReceipt(debtWithBorrower.id, queryRunner);
        } catch (err) {
          logger.warn(
            `Failed to print receipt for debt #${debtWithBorrower.id}:`,
            err,
          );
        }
      }, 0);
    } catch (err) {
      logger.warn(`Failed to schedule receipt printing:`, err);
    }

    // 6. In-app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Confirmed",
        message: `Your payment of ${payment.amount} for debt "${debtWithBorrower.name}" has been confirmed. Thank you!`,
        type: "payment_confirmation",
        metadata: { paymentId: payment.id, debtId: payment.debt.id },
      },
      user,
      queryRunner,
    );

    // 7. Audit log
    await auditLogger.logUpdate(
      "PaymentTransaction",
      payment.id,
      { confirmed: false },
      { confirmed: true },
      user,
    );
  }
}

module.exports = { PaymentTransactionStateTransitionService };
