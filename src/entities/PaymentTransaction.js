const { EntitySchema } = require("typeorm");

const PaymentTransaction = new EntitySchema({
  name: "PaymentTransaction",
  tableName: "payment_transactions",
  columns: {
    id: { type: Number, primary: true, generated: true },
    methodId: { type: Number, nullable: true },
    amount: { type: "decimal", precision: 12, scale: 2 },
    paymentDate: { type: Date },
    reference: { type: String, nullable: true },
    notes: { type: String, nullable: true },
    deletedAt: { type: Date, nullable: true },
    recordedAt: { type: Date, createDate: true },
  },
  relations: {
    debt: {
      target: "Debt",
      type: "many-to-one",
      joinColumn: true,
      inverseSide: "payments",
      onDelete: "CASCADE",
    },
    paymentMethod: {
      target: "PaymentMethod",
      type: "many-to-one",
      joinColumn: { name: "methodId" },
      nullable: true,
    },
  },
});

module.exports = PaymentTransaction;
