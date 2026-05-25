// src/entities/LoanAgreement.js (updated)
const { EntitySchema } = require("typeorm");

const LoanAgreement = new EntitySchema({
  name: "LoanAgreement",
  tableName: "loan_agreements",
  columns: {
    id: { type: Number, primary: true, generated: true },
    status: {
      type: "varchar",
      default: "draft",
      enum: ["draft", "signed"],
    },
    agreementDate: { type: Date, nullable: true },
    lenderName: { type: String, nullable: true },
    termsText: { type: "text", nullable: true },
    filePath: { type: String, nullable: true },
    deletedAt: { type: Date, nullable: true },
    signedAt: { type: "datetime", nullable: true },
    signedBy: { type: "varchar", nullable: true },
    
    // ✅ Bagong fields para sa snapshot ng loan terms
    principalAmount: { type: "decimal", precision: 12, scale: 2, nullable: true },
    interestRate: { type: "decimal", precision: 5, scale: 2, nullable: true },
    penaltyRate: { type: "decimal", precision: 5, scale: 2, nullable: true },
    dueDate: { type: Date, nullable: true },
    purpose: { type: "varchar", nullable: true },
    loanStartDate: { type: Date, nullable: true },      // araw ng approval
    anniversaryDay: { type: "int", nullable: true },   // araw ng buwan (1-31)
  },
  relations: {
    debt: {
      target: "Debt",
      type: "many-to-one",
      joinColumn: true,
      inverseSide: "agreements",
      onDelete: "CASCADE",
    },
  },
});

module.exports = LoanAgreement;