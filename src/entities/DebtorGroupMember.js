// src/main/entities/DebtorGroupMember.js
const { EntitySchema } = require("typeorm");

const DebtorGroupMember = new EntitySchema({
  name: "DebtorGroupMember",
  tableName: "debtor_group_members",
  columns: {
    id: { type: Number, primary: true, generated: true },
    groupId: { type: Number },
    debtorId: { type: Number },
    assignedAt: { type: Date, createDate: true },
  },
  relations: {
    group: {
      target: "DebtorGroup",
      type: "many-to-one",
      joinColumn: { name: "groupId" },
      onDelete: "CASCADE",
    },
    debtor: {
      target: "Borrower",
      type: "many-to-one",
      joinColumn: { name: "debtorId" },
      onDelete: "CASCADE",
    },
  },
  uniques: [{ columns: ["groupId", "debtorId"] }],
});

module.exports = DebtorGroupMember;