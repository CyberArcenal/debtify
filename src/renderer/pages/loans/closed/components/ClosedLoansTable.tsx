// src/renderer/pages/loans/closed/components/ClosedLoansTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Eye, RefreshCw } from "lucide-react";
import type { ClosedLoan } from "../hooks/useClosedLoans";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ClosedLoansTableProps {
  loans: ClosedLoan[];
  selectedLoans: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (loan: ClosedLoan) => void;
  onReopen: (loan: ClosedLoan) => void;
}

const ClosedLoansTable: React.FC<ClosedLoansTableProps> = ({
  loans,
  selectedLoans,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onReopen,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--border-color)" }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="w-10 px-2 py-3"><input type="checkbox" checked={loans.length > 0 && selectedLoans.length === loans.length} onChange={onToggleSelectAll} className="h-4 w-4 rounded" style={{ accentColor: "var(--primary-color)" }} /></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("name")}><div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>Debt Name {getSortIcon("name")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("borrower")}><div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>Borrower {getSortIcon("borrower")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("totalAmount")}><div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>Total Amount {getSortIcon("totalAmount")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("paidAmount")}><div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>Paid Amount {getSortIcon("paidAmount")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("lastPaymentDate")}><div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>Last Payment {getSortIcon("lastPaymentDate")}</div></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("closedAt")}><div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>Closed Date {getSortIcon("closedAt")}</div></th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: "var(--text-secondary)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id} className="hover:bg-[var(--card-hover-bg)] transition-colors border-b" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-2 py-3"><input type="checkbox" checked={selectedLoans.includes(loan.id)} onChange={() => onToggleSelect(loan.id)} className="h-4 w-4 rounded" style={{ accentColor: "var(--primary-color)" }} /></td>
              <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{loan.name}</td>
              <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{loan.borrower?.name || "—"}</td>
              <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{formatCurrency(loan.totalAmount)}</td>
              <td className="px-4 py-3 font-semibold" style={{ color: "var(--success-color)" }}>{formatCurrency(loan.paidAmount)}</td>
              <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{loan.lastPaymentDate ? formatDate(loan.lastPaymentDate) : "—"}</td>
              <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{formatDate(loan.closedAt)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onView(loan)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--accent-blue)" }} title="View Details"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => onReopen(loan)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--warning-color)" }} title="Reopen"><RefreshCw className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClosedLoansTable;