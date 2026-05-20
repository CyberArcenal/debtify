// src/main/entities/DebtorGroup.js
const { EntitySchema } = require("typeorm");

const DebtorGroup = new EntitySchema({
  name: "DebtorGroup",
  tableName: "debtor_groups",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    description: { type: String, nullable: true },
    color: { type: String, default: "#3b82f6" }, // hex color code
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    members: {
      target: "DebtorGroupMember",
      type: "one-to-many",
      inverseSide: "group",
      cascade: true,
    },
  },
});

module.exports = DebtorGroup;