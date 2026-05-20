// src/renderer/pages/devices/components/PrinterTable.tsx
import React from "react";
import { Printer, Star, Edit, Trash2, Wifi, Bluetooth, Usb, Power, PowerOff } from "lucide-react";
import type { Printer as PrinterType } from "../types";
import { formatDate } from "../../../utils/formatters";

interface PrinterTableProps {
  printers: PrinterType[];
  onSetDefault: (id: number) => void;
  onEdit: (printer: PrinterType) => void;
  onDelete: (printer: PrinterType) => void;
  onTest: (id: number) => void;
  testingId: number | null;
}

const PrinterTable: React.FC<PrinterTableProps> = ({ printers, onSetDefault, onEdit, onDelete, onTest, testingId }) => {
  const getInterfaceIcon = (iface: string) => {
    switch (iface) {
      case "usb": return <Usb className="w-4 h-4" />;
      case "network": return <Wifi className="w-4 h-4" />;
      case "bluetooth": return <Bluetooth className="w-4 h-4" />;
      default: return <Printer className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: "var(--accent-green-light)", color: "var(--success-color)" }}>
            <Power className="w-3 h-3" /> Online
          </span>
        );
      case "offline":
        return (
          <span className="px-2 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: "var(--accent-orange-light)", color: "var(--warning-color)" }}>
            <PowerOff className="w-3 h-3" /> Offline
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: "var(--accent-red-light)", color: "var(--danger-color)" }}>
            Error
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--border-color)" }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Printer</th>
            <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Interface</th>
            <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Connection</th>
            <th className="px-4 py-2 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Last Tested</th>
            <th className="px-4 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {printers.map(printer => (
            <tr key={printer.id} className="border-t hover:bg-[var(--card-hover-bg)]" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{printer.name}</div>
                    {printer.isDefault && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--accent-blue)" }}>
                        <Star className="w-3 h-3 fill-current" /> Default
                      </span>
                    )}
                    {printer.description && <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{printer.description}</div>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                  {getInterfaceIcon(printer.interface)} {printer.interface}
                </div>
              </td>
              <td className="px-4 py-2 font-mono text-sm" style={{ color: "var(--text-primary)" }}>{printer.connectionString}</td>
              <td className="px-4 py-2 text-center">{getStatusBadge(printer.status)}</td>
              <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{printer.lastTested ? formatDate(printer.lastTested) : "—"}</td>
              <td className="px-4 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onTest(printer.id)}
                    disabled={testingId === printer.id}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                    style={{ color: "var(--accent-blue)" }}
                    title="Test Print"
                  >
                    {testingId === printer.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: "var(--accent-blue)" }}></div>
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                  </button>
                  {!printer.isDefault && (
                    <button
                      onClick={() => onSetDefault(printer.id)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                      style={{ color: "var(--warning-color)" }}
                      title="Set as Default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(printer)}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                    style={{ color: "var(--accent-blue)" }}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!printer.isDefault && (
                    <button
                      onClick={() => onDelete(printer)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]"
                      style={{ color: "var(--danger-color)" }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrinterTable;