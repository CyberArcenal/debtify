// src/renderer/pages/devices/types.ts
export interface Printer {
  id: number;
  name: string;
  description: string | null;
  interface: "usb" | "network" | "bluetooth";
  connectionString: string;   // e.g., "USB001", "192.168.1.100:9100"
  isDefault: boolean;
  status: "online" | "offline" | "error";
  lastTested: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddPrinterData {
  name: string;
  description?: string;
  interface: Printer["interface"];
  connectionString: string;
  isDefault?: boolean;
}