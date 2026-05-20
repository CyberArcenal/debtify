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
      case "online": return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1"><Power className="w-3 h-3" /> Online</span>;
      case "offline": return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1"><PowerOff className="w-3 h-3" /> Offline</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Error</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium">Printer</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Interface</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Connection</th>
            <th className="px-4 py-2 text-center text-xs font-medium">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Last Tested</th>
            <th className="px-4 py-2 text-right text-xs font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {printers.map(printer => (
            <tr key={printer.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{printer.name}</div>
                    {printer.isDefault && <span className="text-xs text-blue-600 flex items-center gap-1"><Star className="w-3 h-3 fill-blue-500" /> Default</span>}
                    {printer.description && <div className="text-xs text-gray-500">{printer.description}</div>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-2"><div className="flex items-center gap-1">{getInterfaceIcon(printer.interface)} {printer.interface}</div></td>
              <td className="px-4 py-2 font-mono text-sm">{printer.connectionString}</td>
              <td className="px-4 py-2 text-center">{getStatusBadge(printer.status)}</td>
              <td className="px-4 py-2">{printer.lastTested ? formatDate(printer.lastTested) : "—"}</td>
              <td className="px-4 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onTest(printer.id)} disabled={testingId === printer.id} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Test Print">
                    {testingId === printer.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div> : <Printer className="w-4 h-4" />}
                  </button>
                  {!printer.isDefault && (
                    <button onClick={() => onSetDefault(printer.id)} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600" title="Set as Default">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => onEdit(printer)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit"><Edit className="w-4 h-4" /></button>
                  {!printer.isDefault && (
                    <button onClick={() => onDelete(printer)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
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