// src/main/entities/PaymentMethodStat.js
const { EntitySchema } = require("typeorm");

const PaymentMethodStat = new EntitySchema({
  name: "PaymentMethodStat",
  tableName: "payment_method_stats",
  columns: {
    id: { type: Number, primary: true, generated: true },
    transactionCount: { type: Number, default: 0 },
    totalAmount: { type: "decimal", precision: 12, scale: 2, default: 0 },
  },
  relations: {
    method: {
      target: "PaymentMethod",
      type: "one-to-one",
      joinColumn: { name: "methodId" },
      onDelete: "CASCADE",
    },
  },
});

module.exports = PaymentMethodStat;