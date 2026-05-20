// src/main/entities/CreditCheckLog.js
const { EntitySchema } = require("typeorm");

const CreditCheckLog = new EntitySchema({
  name: "CreditCheckLog",
  tableName: "credit_check_logs",
  columns: {
    id: { type: Number, primary: true, generated: true },
    debtorId: { type: Number },
    score: { type: Number, default: 0 }, // 300-850
    riskLevel: { type: String, enum: ["Low", "Medium", "High"] },
    remarks: { type: String, nullable: true },
    dateChecked: { type: Date, createDate: true },
    createdAt: { type: Date, createDate: true },
  },
  relations: {
    debtor: {
      target: "Borrower",
      type: "many-to-one",
      joinColumn: { name: "debtorId" },
      onDelete: "CASCADE",
    },
  },
});

module.exports = CreditCheckLog;