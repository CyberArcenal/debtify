// src/renderer/pages/debtors/group/types.ts
export interface DebtorGroup {
  id: number;
  name: string;
  description: string | null;
  color: string; // hex or tailwind color class
  createdAt: string;
  updatedAt: string;
}

export interface DebtorGroupAssignment {
  debtorId: number;
  groupId: number;
  assignedAt: string;
}