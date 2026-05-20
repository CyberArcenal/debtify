// src/main/entities/LoanApplication.js
const { EntitySchema } = require("typeorm");

const LoanApplication = new EntitySchema({
  name: "LoanApplication",
  tableName: "loan_applications",
  columns: {
    id: { type: Number, primary: true, generated: true },
    debtorId: { type: Number, nullable: true }, // existing debtor, or null if new debtor created
    debtorName: { type: String }, // snapshot
    debtorContact: { type: String, nullable: true },
    debtorEmail: { type: String, nullable: true },
    debtorAddress: { type: String, nullable: true },
    requestedAmount: { type: "decimal", precision: 12, scale: 2 },
    purpose: { type: String },
    proposedDueDate: { type: Date },
    interestRate: { type: "decimal", precision: 5, scale: 2, nullable: true },
    status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
    approvedAt: { type: Date, nullable: true },
    rejectedAt: { type: Date, nullable: true },
    approvedBy: { type: String, nullable: true },
    rejectionReason: { type: String, nullable: true },
    deletedAt: { type: Date, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    debtor: {
      target: "Borrower",
      type: "many-to-one",
      joinColumn: { name: "debtorId" },
      nullable: true,
    },
  },
});

module.exports = LoanApplication;