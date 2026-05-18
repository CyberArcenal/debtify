// src/renderer/pages/loans/applications/services/mockApplicationService.ts
import type { LoanApplication, LoanApplicationCreateData } from "../types";
import borrowersAPI from "../../../../api/core/borrower";
import debtsAPI from "../../../../api/core/debt";

const STORAGE_KEY = "loan_applications";

// Demo data
const defaultApplications: LoanApplication[] = [
  {
    id: 1,
    debtorId: 1,
    debtorName: "John Doe",
    requestedAmount: 50000,
    purpose: "Business expansion",
    proposedDueDate: "2025-12-31",
    interestRate: 10,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    debtorId: 2,
    debtorName: "Jane Smith",
    requestedAmount: 25000,
    purpose: "Medical emergency",
    proposedDueDate: "2025-10-15",
    interestRate: 12,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let nextId = 3;

// Function declaration (hoisted)
export function getApplications(): LoanApplication[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function init() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultApplications));
    nextId = defaultApplications.length + 1;
  } else {
    const apps = getApplications();
    nextId = Math.max(...apps.map(a => a.id), 0) + 1;
  }
}
init();

export function getApplicationById(id: number): LoanApplication | undefined {
  return getApplications().find(a => a.id === id);
}

export async function createApplication(data: LoanApplicationCreateData, user = "system"): Promise<LoanApplication> {
  let debtorId = data.debtorId;
  let debtorName = "";

  // If new debtor, create borrower first
  if (!debtorId && data.newDebtor) {
    const borrowerRes = await borrowersAPI.create({
      name: data.newDebtor.name,
      contact: data.newDebtor.contact || null,
      email: data.newDebtor.email || null,
      address: data.newDebtor.address || null,
      notes: data.newDebtor.notes || null,
    });
    if (!borrowerRes.status) throw new Error(borrowerRes.message);
    debtorId = borrowerRes.data.id;
    debtorName = borrowerRes.data.name;
  } else if (debtorId) {
    const borrowerRes = await borrowersAPI.getById(debtorId);
    if (borrowerRes.status) debtorName = borrowerRes.data.name;
    else debtorName = "Unknown";
  }

  const newApplication: LoanApplication = {
    id: nextId++,
    debtorId,
    debtorName,
    requestedAmount: data.requestedAmount,
    purpose: data.purpose,
    proposedDueDate: data.proposedDueDate,
    interestRate: data.interestRate || null,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const apps = getApplications();
  apps.push(newApplication);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return newApplication;
}

export async function approveApplication(id: number, user = "system"): Promise<LoanApplication> {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) throw new Error("Application not found");
  const app = apps[index];
  if (app.status !== "pending") throw new Error("Only pending applications can be approved");

  // Create active debt
  if (!app.debtorId) throw new Error("No debtor associated with this application");
  const debtData = {
    name: `Loan Application: ${app.purpose}`,
    totalAmount: app.requestedAmount,
    paidAmount: 0,
    dueDate: app.proposedDueDate,
    status: "active" as const,
    interestRate: app.interestRate,
    penaltyRate: null,
    borrowerId: app.debtorId,
  };
  const debtRes = await debtsAPI.create(debtData, user);
  if (!debtRes.status) throw new Error(debtRes.message);

  apps[index] = {
    ...app,
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: user,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return apps[index];
}

export async function rejectApplication(id: number, reason?: string, user = "system"): Promise<LoanApplication> {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) throw new Error("Application not found");
  const app = apps[index];
  if (app.status !== "pending") throw new Error("Only pending applications can be rejected");
  apps[index] = {
    ...app,
    status: "rejected",
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason || null,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return apps[index];
}

export function deleteApplication(id: number): boolean {
  const apps = getApplications();
  const filtered = apps.filter(a => a.id !== id);
  if (filtered.length === apps.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function updateApplicationStatus(id: number, status: "pending" | "approved" | "rejected"): LoanApplication | null {
  const apps = getApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;
  apps[index] = { ...apps[index], status, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  return apps[index];
}