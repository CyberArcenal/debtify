// src/renderer/pages/loans/overdue/components/OverdueLoansTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Bell, CreditCard, AlertTriangle, Phone, Mail } from "lucide-react";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface OverdueLoansTableProps {
  loans: OverdueLoan[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSendReminder: (loan: OverdueLoan) => void;
  onRecordPayment: (loan: OverdueLoan) => void;
  onApplyPenalty: (loan: OverdueLoan) => void;
}

const OverdueLoansTable: React.FC<OverdueLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onSendReminder,
  onRecordPayment,
  onApplyPenalty,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days >= 90) return "bg-red-600 text-white";
    if (days >= 60) return "bg-red-500 text-white";
    if (days >= 30) return "bg-orange-500 text-white";
    return "bg-yellow-500 text-white";
  };

  return (
    <div className="overflow-x-auto rounded-md border border-red-200" style={{ borderColor: "var(--border-color)" }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="w-10 px-2 py-3"><input type="checkbox" checked={loans.length > 0 && selectedLoans.length === loans.length} onChange={onToggleSelectAll} className="h-4 w-4 rounded" style={{ accentColor: "var(--primary-color)" }} /></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("name")}><div className="flex items-center gap-1">Debt Name {getSortIcon("name")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("borrower")}><div className="flex items-center gap-1">Borrower / Contact {getSortIcon("borrower")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("remainingAmount")}><div className="flex items-center gap-1">Remaining {getSortIcon("remainingAmount")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("dueDate")}><div className="flex items-center gap-1">Due Date {getSortIcon("dueDate")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("daysOverdue")}><div className="flex items-center gap-1">Days Overdue {getSortIcon("daysOverdue")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Penalty</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id} className="hover:bg-[var(--card-hover-bg)] transition-colors border-b" style={{ borderColor: "var(--border-color)", backgroundColor: "rgba(239,68,68,0.02)" }}>
              <td className="px-2 py-3"><input type="checkbox" checked={selectedLoans.includes(loan.id)} onChange={() => onToggleSelect(loan.id)} className="h-4 w-4 rounded" style={{ accentColor: "var(--primary-color)" }} /></td>
              <td className="px-4 py-3 font-medium">{loan.name}</td>
              <td className="px-4 py-3">
                <div>{loan.borrower?.name || "—"}</div>
                {loan.borrower?.contact && <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1"><Phone className="w-3 h-3" /> {loan.borrower.contact}</div>}
                {loan.borrower?.email && <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1"><Mail className="w-3 h-3" /> {loan.borrower.email}</div>}
              </td>
              <td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(loan.remainingAmount)}</td>
              <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getDaysOverdueBadge(loan.daysOverdue)}`}>{loan.daysOverdue} days</span></td>
              <td className="px-4 py-3">{loan.penaltyAmount ? formatCurrency(loan.penaltyAmount) : "—"}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onSendReminder(loan)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] text-blue-500" title="Send Reminder"><Bell className="w-4 h-4" /></button>
                  <button onClick={() => onRecordPayment(loan)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] text-green-500" title="Record Payment"><CreditCard className="w-4 h-4" /></button>
                  <button onClick={() => onApplyPenalty(loan)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] text-orange-500" title="Apply Penalty"><AlertTriangle className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverdueLoansTable;