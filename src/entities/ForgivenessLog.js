// src/entities/ForgivenessLog.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ForgivenessLog",
  tableName: "forgiveness_logs",
  columns: {
    id: { type: "int", primary: true, generated: true },
    debtId: { type: "int" },
    borrowerId: { type: "int" },   // denormalized for faster queries
    amountForgiven: { type: "decimal", precision: 12, scale: 2 },
    previousTotalAmount: { type: "decimal", precision: 12, scale: 2 },
    newTotalAmount: { type: "decimal", precision: 12, scale: 2 },
    reason: { type: "text", nullable: true },
    createdBy: { type: "varchar" },
    createdAt: { type: "datetime", default: () => "CURRENT_TIMESTAMP" },
    // optional: approval workflow
    status: { type: "varchar", default: "approved" }, // pending, approved, rejected
    approvedBy: { type: "varchar", nullable: true },
    approvedAt: { type: "datetime", nullable: true },
  },
  relations: {
    debt: { type: "many-to-one", target: "Debt", joinColumn: { name: "debtId" } },
    borrower: { type: "many-to-one", target: "Borrower", joinColumn: { name: "borrowerId" } },
  },
  indices: [
    { name: "IDX_FORGIVENESS_BORROWER", columns: ["borrowerId"] },
    { name: "IDX_FORGIVENESS_CREATED_AT", columns: ["createdAt"] },
  ],
});