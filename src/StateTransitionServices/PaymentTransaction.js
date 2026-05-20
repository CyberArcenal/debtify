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

  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Void a payment (before it's applied)
   */
  async onVoid(payment, user = "system", queryRunner = null) {
    logger.info(`[Transition] Voiding payment transaction #${payment.id} by ${user}`);

    const paymentRepo = this._getRepo(PaymentTransaction, queryRunner);
    const debtRepo = this._getRepo(Debt, queryRunner);

    // 1. Reverse the payment: increase debt remainingAmount by voided amount
    const debt = payment.debt;
    if (debt) {
      debt.remainingAmount += payment.amount;
      debt.paidAmount -= payment.amount;
      if (debt.remainingAmount < 0) debt.remainingAmount = 0;
      if (debt.paidAmount < 0) debt.paidAmount = 0;
      debt.updatedAt = new Date();
      await debtRepo.save(debt);
    }

    // 2. Create a reversal transaction (negative amount)
    const reversal = paymentRepo.create({
      amount: -payment.amount,
      paymentDate: new Date(),
      reference: `Reversal of #${payment.id}`,
      notes: `Voided by ${user}`,
      debt: debt,
    });
    await paymentRepo.save(reversal);

    // 3. Update payment status to 'voided' (add a 'status' column or a 'voided' boolean)
    // For now, we assume a 'voided' boolean exists. If not, we can use `deletedAt` as a marker.
    payment.voided = true; // hypothetical field
    payment.updatedAt = new Date();
    await paymentRepo.save(payment);

    // 4. Notify debtor (in‑app)
    if (debt?.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Payment Voided",
          message: `Your payment of ${payment.amount} for debt "${debt.name}" has been voided.`,
          type: "warning",
          metadata: { paymentId: payment.id, debtId: debt.id },
        },
        user,
        queryRunner
      );
    }

    // 5. Audit log
    await auditLogger.logUpdate("PaymentTransaction", payment.id, { status: "active" }, { status: "voided" }, user);
  }

  /**
   * Refund a payment
   */
  async onRefund(payment, refundAmount, user = "system", queryRunner = null) {
    logger.info(`[Transition] Refunding ${refundAmount} from payment #${payment.id} by ${user}`);

    const paymentRepo = this._getRepo(PaymentTransaction, queryRunner);
    const debtRepo = this._getRepo(Debt, queryRunner);
    const debt = payment.debt;

    if (!debt) throw new Error("Payment has no associated debt");

    // 1. Create a refund transaction record (negative amount)
    const refund = paymentRepo.create({
      amount: -refundAmount,
      paymentDate: new Date(),
      reference: `Refund for #${payment.id}`,
      notes: `Refund processed by ${user}`,
      debt: debt,
    });
    await paymentRepo.save(refund);

    // 2. Update debt remainingAmount (increase)
    debt.remainingAmount += refundAmount;
    debt.paidAmount -= refundAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    if (debt.paidAmount < 0) debt.paidAmount = 0;
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    // 3. If original payment was via gateway, process refund externally (placeholder)
    logger.info(`[PaymentTransaction] External refund for payment #${payment.id} would be processed here.`);

    // 4. Notify debtor (in‑app)
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Refunded",
        message: `A refund of ${refundAmount} has been issued for your payment of ${payment.amount} on debt "${debt.name}".`,
        type: "info",
        metadata: { paymentId: payment.id, refundAmount },
      },
      user,
      queryRunner
    );

    // 5. Audit log
    await auditLogger.logCreate("PaymentTransaction", refund.id, refund, user);
    await auditLogger.logUpdate("Debt", debt.id, { paidAmount: debt.paidAmount + refundAmount }, { paidAmount: debt.paidAmount }, user);
  }

  /**
   * Confirm payment (e.g., after bank verification)
   */
  async onConfirm(payment, user = "system", queryRunner = null) {
    logger.info(`[Transition] Confirming payment #${payment.id} by ${user}`);

    const paymentRepo = this._getRepo(PaymentTransaction, queryRunner);
    const debtRepo = this._getRepo(Debt, queryRunner);
    const debt = payment.debt;

    if (!debt) throw new Error("Payment has no associated debt");

    // 1. Mark payment as confirmed (add a 'confirmed' boolean or status)
    payment.confirmed = true; // hypothetical field
    payment.updatedAt = new Date();
    await paymentRepo.save(payment);

    // 2. Apply the payment to debt if not already applied (the debt should already reflect paidAmount, but ensure)
    // Typically the debt is updated when payment is created, so we may not need to do anything here.
    // However, to be safe, we recalc:
    const totalPaid = await paymentRepo.sum("amount", { debt: { id: debt.id }, confirmed: true });
    debt.paidAmount = totalPaid;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    await debtRepo.save(debt);

    // 3. Generate receipt (use PrinterService)
    try {
      const printerService = require("../services/Printer");
      await printerService.printReceipt(debt.id);
    } catch (err) {
      logger.warn(`Failed to print receipt for debt #${debt.id}:`, err);
    }

    // 4. Trigger thank‑you notification (in‑app)
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Confirmed",
        message: `Your payment of ${payment.amount} for debt "${debt.name}" has been confirmed. Thank you!`,
        type: "success",
        metadata: { paymentId: payment.id, debtId: debt.id },
      },
      user,
      queryRunner
    );

    // 5. Audit log
    await auditLogger.logUpdate("PaymentTransaction", payment.id, { confirmed: false }, { confirmed: true }, user);
  }
}

module.exports = { PaymentTransactionStateTransitionService };