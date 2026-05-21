// src/main/entities/PaymentMethod.js
const { EntitySchema } = require("typeorm");

const PaymentMethod = new EntitySchema({
  name: "PaymentMethod",
  tableName: "payment_methods",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, unique: true },
    description: { type: String, nullable: true },
    icon: { type: String, default: "CreditCard" },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    stats: {
      target: "PaymentMethodStat",
      type: "one-to-one",
      inverseSide: "method",
      cascade: true,
    },
    transactions: {
      target: "PaymentTransaction",
      type: "one-to-many",
      inverseSide: "paymentMethod",
    },
  },
});

module.exports = PaymentMethod;
