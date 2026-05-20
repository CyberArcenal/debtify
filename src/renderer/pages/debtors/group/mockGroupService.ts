// // src/renderer/pages/debtors/group/mockGroupService.ts
// import type { DebtorGroup, DebtorGroupAssignment } from "./types";

// const GROUPS_STORAGE_KEY = "debtor_groups";
// const ASSIGNMENTS_STORAGE_KEY = "debtor_group_assignments";

// // Demo groups
// const defaultGroups: DebtorGroup[] = [
//   { id: 1, name: "VIP", description: "High-value, reliable debtors", color: "#10b981", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
//   { id: 2, name: "Regular", description: "Standard debtors", color: "#3b82f6", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
//   { id: 3, name: "High Risk", description: "Frequent overdue or default", color: "#dc2626", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
// ];

// // Define getGroups first (function declaration is hoisted)
// export function getGroups(): DebtorGroup[] {
//   const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
//   return raw ? JSON.parse(raw) : [];
// }

// let nextGroupId = 4;

// function initGroups() {
//   if (!localStorage.getItem(GROUPS_STORAGE_KEY)) {
//     localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(defaultGroups));
//   } else {
//     const groups = getGroups();
//     nextGroupId = Math.max(...groups.map(g => g.id), 0) + 1;
//   }
// }
// initGroups();

// export function getGroupById(id: number): DebtorGroup | undefined {
//   return getGroups().find(g => g.id === id);
// }

// export function createGroup(data: Omit<DebtorGroup, "id" | "createdAt" | "updatedAt">): DebtorGroup {
//   const groups = getGroups();
//   const newGroup: DebtorGroup = {
//     id: nextGroupId++,
//     ...data,
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   };
//   groups.push(newGroup);
//   localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
//   return newGroup;
// }

// export function updateGroup(id: number, data: Partial<Omit<DebtorGroup, "id" | "createdAt" | "updatedAt">>): DebtorGroup | null {
//   const groups = getGroups();
//   const index = groups.findIndex(g => g.id === id);
//   if (index === -1) return null;
//   groups[index] = {
//     ...groups[index],
//     ...data,
//     updatedAt: new Date().toISOString(),
//   };
//   localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
//   return groups[index];
// }

// export function deleteGroup(id: number): boolean {
//   const groups = getGroups();
//   const filtered = groups.filter(g => g.id !== id);
//   if (filtered.length === groups.length) return false;
//   localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(filtered));
//   // Also remove assignments for this group
//   const assignments = getAssignments();
//   const newAssignments = assignments.filter(a => a.groupId !== id);
//   localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(newAssignments));
//   return true;
// }

// // Assignments helpers
// function getAssignments(): DebtorGroupAssignment[] {
//   const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
//   return raw ? JSON.parse(raw) : [];
// }

// export function getGroupsForDebtor(debtorId: number): DebtorGroup[] {
//   const assignments = getAssignments();
//   const groupIds = assignments.filter(a => a.debtorId === debtorId).map(a => a.groupId);
//   const groups = getGroups();
//   return groups.filter(g => groupIds.includes(g.id));
// }

// export function getDebtorIdsForGroup(groupId: number): number[] {
//   const assignments = getAssignments();
//   return assignments.filter(a => a.groupId === groupId).map(a => a.debtorId);
// }

// export function assignDebtorToGroup(debtorId: number, groupId: number): void {
//   const assignments = getAssignments();
//   if (assignments.some(a => a.debtorId === debtorId && a.groupId === groupId)) return;
//   assignments.push({ debtorId, groupId, assignedAt: new Date().toISOString() });
//   localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
// }

// export function removeDebtorFromGroup(debtorId: number, groupId: number): void {
//   const assignments = getAssignments();
//   const filtered = assignments.filter(a => !(a.debtorId === debtorId && a.groupId === groupId));
//   localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(filtered));
// }

// export function bulkAssignDebtorsToGroup(debtorIds: number[], groupId: number): void {
//   const assignments = getAssignments();
//   const newAssignments = [...assignments];
//   for (const debtorId of debtorIds) {
//     if (!newAssignments.some(a => a.debtorId === debtorId && a.groupId === groupId)) {
//       newAssignments.push({ debtorId, groupId, assignedAt: new Date().toISOString() });
//     }
//   }
//   localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(newAssignments));
// }

// export function removeAllDebtorsFromGroup(groupId: number): void {
//   const assignments = getAssignments();
//   const filtered = assignments.filter(a => a.groupId !== groupId);
//   localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(filtered));
// }