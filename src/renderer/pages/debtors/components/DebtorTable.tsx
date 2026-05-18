// src/renderer/pages/debtors/components/DebtorTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, RefreshCw, User, Mail, Phone } from "lucide-react";
import type { DebtorWithTotal } from "../hooks/useDebtors";
import { formatCurrency } from "../../../utils/formatters";

interface DebtorTableProps {
  debtors: DebtorWithTotal[];
  selectedDebtors: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (debtor: DebtorWithTotal) => void;
  onEdit: (debtor: DebtorWithTotal) => void;
  onDelete: (debtor: DebtorWithTotal) => void;
  onRestore?: (debtor: DebtorWithTotal) => void;
}

const DebtorTable: React.FC<DebtorTableProps> = ({
  debtors,
  selectedDebtors,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
  onRestore,
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
            <th className="w-10 px-2 py-3 text-left">
              <input
                type="checkbox"
                checked={debtors.length > 0 && selectedDebtors.length === debtors.length}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded"
                style={{ accentColor: "var(--primary-color)" }}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("name")}>
              <div className="flex items-center gap-1">Name {getSortIcon("name")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("contact")}>
              <div className="flex items-center gap-1">Contact {getSortIcon("contact")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("email")}>
              <div className="flex items-center gap-1">Email {getSortIcon("email")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("total_debt")}>
              <div className="flex items-center gap-1">Total Debt {getSortIcon("total_debt")}</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {debtors.map((debtor) => (
            <tr
              key={debtor.id}
              className="hover:bg-[var(--card-hover-bg)] transition-colors border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <td className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={selectedDebtors.includes(debtor.id)}
                  onChange={() => onToggleSelect(debtor.id)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--primary-color)" }}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--primary-color)]" />
                  </div>
                  <span className="font-medium">{debtor.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span>{debtor.contact || "—"}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span>{debtor.email || "—"}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(debtor.total_debt || 0)}
              </td>
              <td className="px-4 py-3">
                {debtor.deletedAt ? (
                  <span className="px-2 py-1 rounded-full text-xs bg-[var(--status-overdue-bg)] text-[var(--status-overdue)]">
                    Deleted
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs bg-[var(--status-paid-bg)] text-[var(--status-paid)]">
                    Active
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onView(debtor)}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                  </button>
                  {!debtor.deletedAt ? (
                    <>
                      <button
                        onClick={() => onEdit(debtor)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-[var(--accent-amber)]" />
                      </button>
                      <button
                        onClick={() => onDelete(debtor)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                        title="Soft Delete"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--danger-color)]" />
                      </button>
                    </>
                  ) : (
                    onRestore && (
                      <button
                        onClick={() => onRestore(debtor)}
                        className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                        title="Restore"
                      >
                        <RefreshCw className="w-4 h-4 text-[var(--success-color)]" />
                      </button>
                    )
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

export default DebtorTable;