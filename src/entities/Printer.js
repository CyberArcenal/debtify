// src/main/entities/Printer.js
const { EntitySchema } = require("typeorm");

const Printer = new EntitySchema({
  name: "Printer",
  tableName: "printers",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    description: { type: String, nullable: true },
    interface: { type: String, enum: ["usb", "network", "bluetooth"] },
    connectionString: { type: String }, // e.g., USB001, 192.168.1.100:9100, BT address
    isDefault: { type: Boolean, default: false },
    status: { type: String, default: "offline", enum: ["online", "offline", "error"] },
    lastTested: { type: Date, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
});

module.exports = Printer;