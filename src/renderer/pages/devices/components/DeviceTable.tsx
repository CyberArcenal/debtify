// src/renderer/pages/devices/components/DeviceTable.tsx
import React from "react";
import { Power, PowerOff, Trash2, Laptop, RefreshCw } from "lucide-react";
import type { Device } from "../types";
import { formatDate } from "../../../utils/formatters";

interface DeviceTableProps {
  devices: Device[];
  onRevoke: (device: Device) => void;
  onDelete: (device: Device) => void;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ devices, onRevoke, onDelete }) => {
  const getStatusBadge = (status: Device["status"]) => {
    switch (status) {
      case "active": return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Active</span>;
      case "inactive": return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Inactive</span>;
      case "revoked": return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Revoked</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Unknown</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium">Device Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Device ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Last Seen</th>
            <th className="px-4 py-2 text-center text-xs font-medium">Status</th>
            <th className="px-4 py-2 text-right text-xs font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2"><div className="flex items-center gap-2"><Laptop className="w-4 h-4 text-gray-500" />{device.name}</div></td>
              <td className="px-4 py-2 font-mono text-sm">{device.deviceId}</td>
              <td className="px-4 py-2">{formatDate(device.lastSeen)}</td>
              <td className="px-4 py-2 text-center">{getStatusBadge(device.status)}</td>
              <td className="px-4 py-2 text-right">
                <div className="flex justify-end gap-2">
                  {device.status !== "revoked" && (
                    <button onClick={() => onRevoke(device)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Revoke">
                      <PowerOff className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => onDelete(device)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
               </td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTable;