const { EntitySchema } = require("typeorm");

const PenaltyTransaction = new EntitySchema({
  name: "PenaltyTransaction",
  tableName: "penalty_transactions",
  columns: {
    id: { type: Number, primary: true, generated: true },
    amount: { type: "decimal", precision: 12, scale: 2 },
    penaltyDate: { type: Date },
    reason: { type: String, nullable: true },
    deletedAt: { type: Date, nullable: true },
    createdAt: { type: Date, createDate: true },
  },
  relations: {
    debt: {
      target: "Debt",
      type: "many-to-one",
      joinColumn: true,
      inverseSide: "penalties",
      onDelete: "CASCADE",
    },
  },
});

module.exports = PenaltyTransaction;