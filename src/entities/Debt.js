const { EntitySchema } = require("typeorm");

const Debt = new EntitySchema({
  name: "Debt",
  tableName: "debts",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String }, // e.g., "Personal Loan"
    totalAmount: { type: "decimal", precision: 12, scale: 2 },
    paidAmount: { type: "decimal", precision: 12, scale: 2, default: 0 },
    remainingAmount: { type: "decimal", precision: 12, scale: 2, default: 0 },
    dueDate: { type: Date },
    status: { type: String, default: "active", enum: ["active","paid","overdue","defaulted"] },
    interestRate: { type: "decimal", precision: 5, scale: 2, nullable: true },
    penaltyRate: { type: "decimal", precision: 5, scale: 2, nullable: true },
    deletedAt: { type: Date, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    borrower: {
      target: "Borrower",
      type: "many-to-one",
      joinColumn: true,
      inverseSide: "debts",
      onDelete: "CASCADE",
    },
    agreements: {
      target: "LoanAgreement",
      type: "one-to-many",
      inverseSide: "debt",
    },
    payments: {
      target: "PaymentTransaction",
      type: "one-to-many",
      inverseSide: "debt",
    },
    penalties: {
      target: "PenaltyTransaction",
      type: "one-to-many",
      inverseSide: "debt",
    },
    notifications: {
      target: "Notification",
      type: "one-to-many",
      inverseSide: "debt",
    },
  },
});

module.exports = Debt;